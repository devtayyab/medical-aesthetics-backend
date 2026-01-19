import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentHold } from './entities/appointment-hold.entity';
import { BlockedTimeSlot } from './entities/blocked-time-slot.entity';
import { ClinicsService } from '../clinics/clinics.service';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AppointmentHold)
    private holdsRepository: Repository<AppointmentHold>,
    @InjectRepository(BlockedTimeSlot)
    private blockedTimeSlotsRepository: Repository<BlockedTimeSlot>,
    private clinicsService: ClinicsService,
  ) {}

  async getAvailableSlots(
    clinicId: string,
    serviceId: string,
    providerId?: string | null,
    date?: string,
  ): Promise<any[]> {
    console.log('🔵 Availability Request:', { clinicId, serviceId, providerId, date });
    
    // Validate required parameters
    if (!clinicId || !serviceId) {
      throw new Error('Clinic ID and Service ID are required');
    }
    
    // Default to today if no date provided
    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log('🔵 Using date:', targetDate);
    
    const clinic = await this.clinicsService.findById(clinicId);
    if (!clinic) {
      throw new Error('Clinic not found');
    }
    

    console.log('🔵 Clinic:', clinic);

    const services = await this.clinicsService.findServices(clinicId);
    if (!services || services.length === 0) {
      throw new Error('No services found for this clinic');
    }
    
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    const timezone = clinic.timezone || 'UTC';
    console.log('🔵 Using timezone:', timezone);
    
    // Create date objects for start and end of day (simplified - ignoring timezone for now)
    const targetDateObj = new Date(targetDate + 'T00:00:00.000Z');
    const startOfDay = new Date(targetDateObj);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDateObj);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Get business hours for the day
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = daysOfWeek[targetDateObj.getUTCDay()];
    const businessHours = clinic.businessHours?.[dayOfWeek];
    
    if (!businessHours || !businessHours.isOpen) {
      return []; // Clinic is closed
    }

    // Get existing appointments
    const existingAppointments = await this.appointmentsRepository.find({
      where: {
        providerId,
        startTime: Between(startOfDay, endOfDay),
        status: AppointmentStatus.CONFIRMED,
      },
    });

    // Get active holds
    const activeHolds = await this.holdsRepository.find({
      where: {
        providerId,
        startTime: Between(startOfDay, endOfDay),
        expiresAt: new Date(),
      },
    });

    // Get blocked time slots for this provider or clinic-wide
    const blockedSlots = await this.blockedTimeSlotsRepository.find({
      where: [
        {
          clinicId,
          providerId: providerId || undefined,
          startTime: Between(startOfDay, endOfDay),
        },
        {
          clinicId,
          providerId: null, // Clinic-wide blocks
          startTime: Between(startOfDay, endOfDay),
        },
      ],
    });

    // Generate available slots
    const slots = [];
    
    // Parse business hours
    const [openHour, openMinute] = businessHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = businessHours.close.split(':').map(Number);
    
    // Create open and close times
    const openTime = new Date(targetDateObj);
    openTime.setUTCHours(openHour, openMinute, 0, 0);
    
    const closeTime = new Date(targetDateObj);
    closeTime.setUTCHours(closeHour, closeMinute, 0, 0);
    
    let currentSlot = new Date(openTime);
    
    // Generate slots in 30-minute intervals
    while (currentSlot.getTime() + (service.durationMinutes * 60000) <= closeTime.getTime()) {
      const slotStart = new Date(currentSlot);
      const slotEnd = new Date(currentSlot.getTime() + (service.durationMinutes * 60000));
      
      // Check if slot conflicts with existing appointments, holds, or blocked slots
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);
        return slotStart < aptEnd && slotEnd > aptStart;
      }) || activeHolds.some(hold => {
        const holdStart = new Date(hold.startTime);
        const holdEnd = new Date(hold.endTime);
        return slotStart < holdEnd && slotEnd > holdStart;
      }) || blockedSlots.some(blocked => {
        const blockedStart = new Date(blocked.startTime);
        const blockedEnd = new Date(blocked.endTime);
        return slotStart < blockedEnd && slotEnd > blockedStart;
      });

      console.log('🔵 Slot:', { slotStart, slotEnd, hasConflict });
      if (!hasConflict) { // Future slots only
        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          available: true,
        });
      }

      // Move to next 30-minute slot
      currentSlot.setTime(currentSlot.getTime() + (30 * 60000));
    }

    return slots;
  }

  async getClinicAvailability(
    userId: string,
    userRole: string,
    query: any,
  ): Promise<any> {
    // Get clinic based on user role
    // SECRETARIAT and CLINIC_OWNER have same permissions
    let clinic;
    if (userRole === 'clinic_owner' || userRole === 'secretariat') {
      clinic = await this.clinicsService.findByOwnerId(userId);
    } else {
      // For other roles, we need to find their clinic
      // This is a simplified approach - in reality, you'd need to map users to clinics
      throw new Error('Clinic availability lookup not implemented for this user role');
    }

    if (!clinic) {
      throw new Error('Clinic not found');
    }

    // Get blocked time slots
    const blockedSlots = await this.blockedTimeSlotsRepository.find({
      where: { clinicId: clinic.id },
      relations: ['provider', 'blockedBy'],
    });

    // Return clinic availability settings
    return {
      clinicId: clinic.id,
      clinicName: clinic.name,
      timezone: clinic.timezone,
      businessHours: clinic.businessHours,
      blockedDates: [], // This would come from a separate blocked dates entity
      blockedTimeSlots: blockedSlots.map(slot => ({
        id: slot.id,
        providerId: slot.providerId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reason: slot.reason,
      })),
    };
  }

  async blockTimeSlot(
    clinicId: string,
    providerId: string | null,
    startTime: Date,
    endTime: Date,
    reason: string,
    blockedById: string,
  ): Promise<BlockedTimeSlot> {
    // Verify clinic exists
    const clinic = await this.clinicsService.findById(clinicId);
    if (!clinic) {
      throw new Error('Clinic not found');
    }

    // Check for conflicts with existing appointments
    const conflictingAppointment = await this.appointmentsRepository.findOne({
      where: {
        clinicId: clinic.id,
        providerId: providerId || undefined,
        startTime: Between(startTime, endTime),
        status: AppointmentStatus.CONFIRMED,
      },
    });

    if (conflictingAppointment) {
      throw new Error('Cannot block time slot with existing confirmed appointment');
    }

    const blockedSlot = this.blockedTimeSlotsRepository.create({
      clinicId: clinic.id,
      providerId: providerId || null,
      startTime,
      endTime,
      reason,
      blockedById,
    });

    return this.blockedTimeSlotsRepository.save(blockedSlot);
  }

  async unblockTimeSlot(blockedSlotId: string, userId: string, userRole: string): Promise<void> {
    const blockedSlot = await this.blockedTimeSlotsRepository.findOne({
      where: { id: blockedSlotId },
      relations: ['clinic'],
    });

    if (!blockedSlot) {
      throw new Error('Blocked time slot not found');
    }

    // Verify user has permission (clinic owner or admin)
    if (userRole !== 'admin' && blockedSlot.clinic.ownerId !== userId) {
      throw new Error('Unauthorized to unblock this time slot');
    }

    await this.blockedTimeSlotsRepository.remove(blockedSlot);
  }

  async getBlockedTimeSlots(
    clinicId: string,
    providerId?: string | null,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BlockedTimeSlot[]> {
    const queryBuilder = this.blockedTimeSlotsRepository.createQueryBuilder('blocked')
      .where('blocked.clinicId = :clinicId', { clinicId });

    if (providerId) {
      queryBuilder.andWhere(
        '(blocked.providerId = :providerId OR blocked.providerId IS NULL)',
        { providerId }
      );
    } else {
      queryBuilder.andWhere('blocked.providerId IS NULL');
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('blocked.startTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return queryBuilder.getMany();
  }
}





// import { createClient } from 'npm:@supabase/supabase-js@2';

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//   'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
// };

// interface RSSItem {
//   title: string;
//   content: string;
//   link: string;
//   pubDate: string;
//   thumbnail?: string;
// }

// Deno.serve(async (req: Request) => {
//   if (req.method === 'OPTIONS') {
//     return new Response(null, { status: 200, headers: corsHeaders });
//   }

//   try {
//     const supabase = createClient(
//       Deno.env.get('MY_SUPABASE_URL') ?? '',
//       Deno.env.get('MY_SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     );

//     const { data: sources, error: sourcesError } = await supabase
//       .from('rss_sources')
//       .select('*, projects(*)')
//       .eq('is_active', true);

//     if (sourcesError) throw sourcesError;

//     const results = [];

//     for (const source of sources || []) {
//       try {
//         const response = await fetch(source.feed_url);
//         const xmlText = await response.text();
//         const items = parseRSSFeed(xmlText);

//         for (const item of items.slice(0, 5)) {
//           console.log(`Fetched thumbnail for "${item.title}":`, item.thumbnail);

//           // Check if article already exists
//           const { data: existing } = await supabase
//             .from('articles')
//             .select('id')
//             .eq('original_url', item.link)
//             .eq('project_id', source.project_id)
//             .maybeSingle();

//           if (!existing) {
//             const { data: prompt } = await supabase
//               .from('prompts')
//               .select('*')
//               .eq('project_id', source.project_id)
//               .eq('is_active', true)
//               .maybeSingle();

//             if (prompt) {
//               // Insert article into Supabase
//               const { data: article, error: articleError } = await supabase
//                 .from('articles')
//                 .insert({
//                   project_id: source.project_id,
//                   rss_source_id: source.id,
//                   prompt_id: prompt.id,
//                   original_title: item.title,
//                   original_content: item.content,
//                   original_url: item.link,
//                   thumbnail_url: item.thumbnail,
//                   status: 'draft',
//                 })
//                 .select() // <-- Make sure to select after insert to get the saved row
//                 .single();

//               // Log insert result for debugging
//               if (articleError) {
//                 console.error('Error inserting article:', articleError);
//               } else {
//                 console.log('Inserted article:', article);
//                 results.push({ article_id: article.id, source: source.name });
//               }
//             }
//           }
//         }

//         await supabase
//           .from('rss_sources')
//           .update({ last_fetched_at: new Date().toISOString() })
//           .eq('id', source.id);

//       } catch (err) {
//         console.error(`Error processing source ${source.name}:`, err);
//       }
//     }

//     return new Response(
//       JSON.stringify({ success: true, processed: results.length, results }),
//       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
//     );

//   } catch (error) {
//     console.error('Error:', error);
//     return new Response(
//       JSON.stringify({ error: error.message }),
//       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
//     );
//   }
// });

// // ------------------ RSS Parsing Functions ------------------

// function parseRSSFeed(xml: string): RSSItem[] {
//   const items: RSSItem[] = [];
//   const itemRegex = /<item>(.*?)<\/item>/gs;
//   const matches = xml.matchAll(itemRegex);

//   for (const match of matches) {
//     const itemXml = match[1];
//     const title = extractTag(itemXml, 'title');
//     const link = extractTag(itemXml, 'link');
//     const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded');
//     const pubDate = extractTag(itemXml, 'pubDate');
//     const thumbnail = extractThumbnail(itemXml);

//     if (title && link) {
//       items.push({
//         title: cleanText(title),
//         content: cleanText(description),
//         link: link.trim(),
//         pubDate: pubDate || new Date().toISOString(),
//         thumbnail: thumbnail || '',
//       });
//     }
//   }

//   return items;
// }

// function extractTag(xml: string, tagName: string): string {
//   const regex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[(.*?)\\]\\]><\\/${tagName}>`, 's');
//   const cdataMatch = xml.match(regex);
//   if (cdataMatch) return cdataMatch[1];

//   const simpleRegex = new RegExp(`<${tagName}[^>]*>(.*?)<\\/${tagName}>`, 's');
//   const simpleMatch = xml.match(simpleRegex);
//   return simpleMatch ? simpleMatch[1] : '';
// }

// function extractThumbnail(xml: string): string | null {
//   // 1. <media:thumbnail url="..." />
//   const mediaThumbRegex = /<media:thumbnail[^>]*\surl=['"]([^'"]+)['"][^>]*\/?>/i;
//   const mediaThumbMatch = xml.match(mediaThumbRegex);
//   if (mediaThumbMatch) return mediaThumbMatch[1];

//   // 2. <media:content url="..." medium="image"/>
//   const mediaContentRegex = /<media:content[^>]*\surl=['"]([^'"]+)['"][^>]*medium=['"]image['"][^>]*\/?>/i;
//   const mediaContentMatch = xml.match(mediaContentRegex);
//   if (mediaContentMatch) return mediaContentMatch[1];

//   // 3. <enclosure url="..." type="image/..."/>
//   const enclosureRegex = /<enclosure[^>]*\surl=['"]([^'"]+)['"][^>]*type=['"]image\/[^'"]+['"][^>]*\/?>/i;
//   const enclosureMatch = xml.match(enclosureRegex);
//   if (enclosureMatch) return enclosureMatch[1];

//   return null;
// }

// function cleanText(text: string): string {
//   return text
//     .replace(/<[^>]+>/g, '')
//     .replace(/&nbsp;/g, ' ')
//     .replace(/&amp;/g, '&')
//     .replace(/&lt;/g, '<')
//     .replace(/&gt;/g, '>')
//     .replace(/&quot;/g, '"')
//     .trim();
// }




// import { createClient } from 'npm:@supabase/supabase-js@2';

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Methods': 'POST, OPTIONS',
//   'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
// };

// Deno.serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response(null, { status: 200, headers: corsHeaders });
//   }

//   console.log("🚀 WordPress Publisher started");

//   try {
//     const supabase = createClient(
//       Deno.env.get('MY_SUPABASE_URL') ?? '',
//       Deno.env.get('MY_SUPABASE_SERVICE_ROLE_KEY') ?? ''
//     );

//     // Get pending articles
//     const { data: articles, error } = await supabase
//       .from('articles')
//       .select('*, projects(*)')
//       .eq('status', 'pending_review');

//     if (error) throw error;

//     if (!articles?.length) {
//       console.log("ℹ️ No pending articles");
//       return new Response(JSON.stringify({ success: true, processed: 0 }), {
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//       });
//     }

//     console.log(`📄 Found ${articles.length} article(s)`);

//     const results: any[] = [];

//     for (const article of articles) {
//       console.log(`📝 Processing: ${article.id}`);

//       try {
//         const project = article.projects;

//         if (!project) throw new Error("Project not found");

//         const wpUrl = (project.wordpress_url || '').replace(/\/$/, '');
//         if (!wpUrl.startsWith('http')) throw new Error(`Invalid WordPress URL: ${wpUrl}`);
//         if (wpUrl.includes("wp-admin")) throw new Error(`wordpress_url must be site root, not wp-admin: ${wpUrl}`);

//         const wpApiUrl = `${wpUrl}/wp-json/wp/v2/posts`;
//         console.log("🌐 WP Endpoint:", wpApiUrl);

//         const credentials = btoa(`${project.wordpress_username}:${project.wordpress_app_password}`);

//         // --- Fetch WordPress category from mapping ---
//         const { data: mapping } = await supabase
//           .from('category_mappings')
//           .select('wordpress_category_id')
//           .eq('project_id', article.project_id)
//           .eq('rss_category', article.rss_category_used)
//           .maybeSingle();

//         let categoryId;
//         if (mapping) {
//           categoryId = mapping.wordpress_category_id;
//         } else {
//           console.log(`⚠️ No mapping found for RSS category: ${article.rss_category_used}`);
//           categoryId = undefined; // fallback
//         }

//         // --- Upload featured image if exists ---
//         async function uploadFeaturedImage(imageUrl: string, wpUrl: string, credentials: string) {
//           const imageResp = await fetch(imageUrl);
//           if (!imageResp.ok) throw new Error(`Failed to fetch image: ${imageResp.status}`);
//           const imageBlob = await imageResp.blob();

//           const formData = new FormData();
//           const filename = (imageUrl.split('/').pop() || 'image.jpg').replace(/[^\x00-\x7F]/g, '_');
//           formData.append('file', imageBlob, filename);

//           const uploadUrl = `${wpUrl}/wp-json/wp/v2/media`;

//           const uploadResp = await fetch(uploadUrl, {
//             method: "POST",
//             headers: { "Authorization": `Basic ${credentials}` },
//             body: formData
//           });

//           const raw = await uploadResp.text();
//           if (!uploadResp.ok) throw new Error("Image upload failed: " + raw);

//           return JSON.parse(raw);
//         }

//         let featuredMediaId;
//         if (article.thumbnail_url) {
//           console.log("🖼 Uploading image:", article.thumbnail_url);
//           const media = await uploadFeaturedImage(article.thumbnail_url, wpUrl, credentials);
//           featuredMediaId = media.id;
//         }

//         // --- Publish post to WordPress ---
//         const wpResponse = await fetch(wpApiUrl, {
//           method: 'POST',
//           headers: {
//             'Authorization': `Basic ${credentials}`,
//             'Content-Type': 'application/json',
//             'Accept': 'application/json',
//             'User-Agent': 'SupabaseEdgePublisher'
//           },
//           body: JSON.stringify({
//             title: article.transformed_title,
//             content: article.transformed_content,
//             featured_media: featuredMediaId,
//             categories: categoryId ? [categoryId] : [],
//             status: 'pending'
//           })
//         });

//         const raw = await wpResponse.text();
//         if (!wpResponse.ok) throw new Error(`WP ERROR ${wpResponse.status}: ${raw}`);

//         let wpPost;
//         try { wpPost = JSON.parse(raw); } 
//         catch { throw new Error("WordPress returned HTML instead of JSON"); }

//         // --- Update article in Supabase ---
//         await supabase.from('articles')
//           .update({
//             wordpress_post_id: wpPost.id.toString(),
//             status: 'published',
//             published_at: new Date().toISOString(),
//             updated_at: new Date().toISOString()
//           })
//           .eq('id', article.id);

//         console.log(`✅ Published: ${wpPost.link}`);

//         results.push({ article_id: article.id, wordpress_post_id: wpPost.id, url: wpPost.link });

//       } catch (err) {
//         console.error(`❌ Article failed: ${article.id}`);
//         console.error("📛 Reason:", err.message);
//       }
//     }

//     console.log("🎯 Process completed");

//     return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//     });

//   } catch (error) {
//     console.error("🔥 FATAL ERROR:", error.message);
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 500,
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//     });
//   }
// });
