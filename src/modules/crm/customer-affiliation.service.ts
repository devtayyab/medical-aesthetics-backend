import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerRecord } from './entities/customer-record.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { Clinic } from '../clinics/entities/clinic.entity';

export interface ClinicAffiliation {
  clinicId: string;
  clinicName: string;
  doctorId?: string;
  doctorName?: string;
  firstVisitDate: Date;
  lastVisitDate: Date;
  totalVisits: number;
  totalSpent: number;
  treatments: string[];
  status: 'active' | 'inactive' | 'preferred';
  averageRating?: number;
}

export interface DoctorAffiliation {
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  firstVisitDate: Date;
  lastVisitDate: Date;
  totalVisits: number;
  totalSpent: number;
  specializations: string[];
  treatments: string[];
  status: 'active' | 'inactive' | 'preferred';
}

@Injectable()
export class CustomerAffiliationService {
  constructor(
    @InjectRepository(CustomerRecord)
    private customerRecordsRepository: Repository<CustomerRecord>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Clinic)
    private clinicsRepository: Repository<Clinic>,
  ) {}

  async updateClinicAffiliation(
    customerId: string,
    clinicId: string,
    doctorId?: string,
    treatmentDetails?: any,
  ): Promise<void> {
    const record = await this.customerRecordsRepository.findOne({
      where: { customerId },
    });

    if (!record) {
      throw new Error('Customer record not found');
    }

    // Initialize arrays if they don't exist
    if (!record.clinicHistory) {
      record.clinicHistory = [];
    }

    if (!record.doctorHistory) {
      record.doctorHistory = [];
    }

    // Update or add clinic affiliation
    const existingClinicIndex = record.clinicHistory.findIndex(
      (aff: any) => aff.clinicId === clinicId,
    );

    if (existingClinicIndex >= 0) {
      // Update existing clinic affiliation
      const clinicAff = record.clinicHistory[existingClinicIndex];
      clinicAff.lastVisitDate = new Date();
      clinicAff.totalVisits += 1;
      clinicAff.totalSpent += treatmentDetails?.totalAmount || 0;

      if (treatmentDetails?.treatment) {
        if (!clinicAff.treatments.includes(treatmentDetails.treatment)) {
          clinicAff.treatments.push(treatmentDetails.treatment);
        }
      }
    } else {
      // Create new clinic affiliation
      const clinic = await this.clinicsRepository.findOne({
        where: { id: clinicId },
      });

      const newClinicAff: ClinicAffiliation = {
        clinicId,
        clinicName: clinic?.name || 'Unknown Clinic',
        firstVisitDate: new Date(),
        lastVisitDate: new Date(),
        totalVisits: 1,
        totalSpent: treatmentDetails?.totalAmount || 0,
        treatments: treatmentDetails?.treatment ? [treatmentDetails.treatment] : [],
        status: 'active',
      };

      record.clinicHistory.push(newClinicAff);
    }

    // Update doctor affiliation if provided
    if (doctorId) {
      await this.updateDoctorAffiliation(customerId, doctorId, clinicId, treatmentDetails);
    }

    // Update preferred and last visited
    record.lastClinicId = clinicId;
    if (doctorId) {
      record.lastDoctorId = doctorId;
    }

    // Auto-set preferred clinic/doctor after multiple visits
    if (record.clinicHistory.length === 1) {
      record.preferredClinicId = clinicId;
    }

    await this.customerRecordsRepository.save(record);
  }

  private async updateDoctorAffiliation(
    customerId: string,
    doctorId: string,
    clinicId: string,
    treatmentDetails?: any,
  ): Promise<void> {
    const record = await this.customerRecordsRepository.findOne({
      where: { customerId },
    });

    if (!record) return;

    const existingDoctorIndex = record.doctorHistory.findIndex(
      (aff: any) => aff.doctorId === doctorId,
    );

    if (existingDoctorIndex >= 0) {
      // Update existing doctor affiliation
      const doctorAff = record.doctorHistory[existingDoctorIndex];
      doctorAff.lastVisitDate = new Date();
      doctorAff.totalVisits += 1;
      doctorAff.totalSpent += treatmentDetails?.totalAmount || 0;

      if (treatmentDetails?.treatment) {
        if (!doctorAff.treatments.includes(treatmentDetails.treatment)) {
          doctorAff.treatments.push(treatmentDetails.treatment);
        }
      }
    } else {
      // Create new doctor affiliation
      const newDoctorAff: DoctorAffiliation = {
        doctorId,
        doctorName: 'Dr. Unknown', // This should be fetched from user service
        clinicId,
        clinicName: 'Unknown Clinic', // This should be fetched from clinic service
        firstVisitDate: new Date(),
        lastVisitDate: new Date(),
        totalVisits: 1,
        totalSpent: treatmentDetails?.totalAmount || 0,
        specializations: [],
        treatments: treatmentDetails?.treatment ? [treatmentDetails.treatment] : [],
        status: 'active',
      };

      record.doctorHistory.push(newDoctorAff);
    }

    // Auto-set preferred doctor after multiple visits
    if (record.doctorHistory.length === 1) {
      record.preferredDoctorId = doctorId;
    }

    await this.customerRecordsRepository.save(record);
  }

  async getClinicAffiliations(customerId: string): Promise<ClinicAffiliation[]> {
    const record = await this.customerRecordsRepository.findOne({
      where: { customerId },
    });

    if (!record || !record.clinicHistory) {
      return [];
    }

    // Sort by last visit date, most recent first
    return record.clinicHistory.sort(
      (a: ClinicAffiliation, b: ClinicAffiliation) =>
        new Date(b.lastVisitDate).getTime() - new Date(a.lastVisitDate).getTime(),
    );
  }

  async getDoctorAffiliations(customerId: string): Promise<DoctorAffiliation[]> {
    const record = await this.customerRecordsRepository.findOne({
      where: { customerId },
    });

    if (!record || !record.doctorHistory) {
      return [];
    }

    // Sort by last visit date, most recent first
    return record.doctorHistory.sort(
      (a: DoctorAffiliation, b: DoctorAffiliation) =>
        new Date(b.lastVisitDate).getTime() - new Date(a.lastVisitDate).getTime(),
    );
  }

  async getPreferredClinic(customerId: string): Promise<ClinicAffiliation | null> {
    const record = await this.customerRecordsRepository.findOne({
      where: { customerId },
    });

    if (!record?.preferredClinicId || !record.clinicHistory) {
      return null;
    }

    return record.clinicHistory.find(
      (aff: ClinicAffiliation) => aff.clinicId === record.preferredClinicId,
    ) || null;
  }

  async getPreferredDoctor(customerId: string): Promise<DoctorAffiliation | null> {
    const record = await this.customerRecordsRepository.findOne({
      where: { customerId },
    });

    if (!record?.preferredDoctorId || !record.doctorHistory) {
      return null;
    }

    return record.doctorHistory.find(
      (aff: DoctorAffiliation) => aff.doctorId === record.preferredDoctorId,
    ) || null;
  }

  async setPreferredClinic(customerId: string, clinicId: string): Promise<void> {
    await this.customerRecordsRepository.update(
      { customerId },
      { preferredClinicId: clinicId },
    );
  }

  async setPreferredDoctor(customerId: string, doctorId: string): Promise<void> {
    await this.customerRecordsRepository.update(
      { customerId },
      { preferredDoctorId: doctorId },
    );
  }

  async getActivePatientsByClinic(clinicId: string, daysSinceLastVisit: number = 90): Promise<CustomerRecord[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastVisit);

    return this.customerRecordsRepository
      .createQueryBuilder('record')
      .where('record.lastClinicId = :clinicId', { clinicId })
      .andWhere('(record.lastAppointmentDate > :cutoffDate OR record.lastAppointmentDate IS NULL)', {
        cutoffDate,
      })
      .leftJoinAndSelect('record.customer', 'customer')
      .getMany();
  }

  async getActivePatientsByDoctor(doctorId: string, daysSinceLastVisit: number = 90): Promise<CustomerRecord[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastVisit);

    return this.customerRecordsRepository
      .createQueryBuilder('record')
      .where('record.lastDoctorId = :doctorId', { doctorId })
      .andWhere('(record.lastAppointmentDate > :cutoffDate OR record.lastAppointmentDate IS NULL)', {
        cutoffDate,
      })
      .leftJoinAndSelect('record.customer', 'customer')
      .getMany();
  }
}
