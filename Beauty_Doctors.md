# **New Requirements and Functional Updates** 

We reviewed the current codebase and identified which items are already part of the platform and which ones are completely new requirements. 

Below is the updated breakdown of the requested changes. 

# **1. Clinical Principles Section – Homepage** 

This statement is not currently part of the platform, either in the footer or on the homepage. 

Based on the lawyer's recommendation, instead of adding it as small fine print in the footer, we will create a dedicated and more visible **“Clinical Principles”** section on the homepage. 

This section will be placed directly before the final **“Download Our App”** section. 

It will highlight: 

- **Core Principle:** “Every treatment begins with medical assessment.” 

- **Patient Safety & Diligence:** Every aesthetic procedure requires a prior clinical evaluation by a verified doctor. 

- **Trust Badges:** Verified medical practitioners, personalised clinical evaluation, and regulatory compliance. 

# **New Sections and Pages** 

# **2. New “For Clinics & Partners” Page** 

**URL:** /for-clinics 

A completely new B2B landing page and onboarding flow will be created for clinics and partners. 

The page will allow clinics to register and provide their information, while doctor credentials can be submitted and verified as part of the onboarding process. 

# **3. New Top Utility Bar** 

A new utility bar will be added at the very top of the website, above the main header. 

It will clearly display: 

- Phone numbers: **6948880498 / 2112184564** 

- Email 

- Partner Portal link 

The purpose is to make the contact and partner information easily accessible without affecting the main navigation. 

# **4. New Treatments 3-Column Mega Menu** 

A completely new mega menu will be added to the **Treatments** navigation. 

When the user hovers over or opens Treatments, the menu will display the available medical categories and subcategories in a clean **three-column layout** . 

This will make it easier for users to browse and find specific treatments. 

# **Clinical and Medical Compliance Updates** 

# **5. Medical Assessment Box on Every Treatment Page** 

# **Status: NEW** 

Each treatment page, including TreatmentDetails.tsx, will include a professional medical notice. 

Suggested wording: 

“Treatment suitability and the final treatment plan are determined by the treating physician following an individual medical assessment.” 

This notice will make it clear that selecting a treatment online does not replace a medical assessment. 

# **6. Pre-Confirmation Notice in the Booking Flow** 

# **Status: NEW** 

A medical notice will be displayed immediately before the user confirms a booking. 

Suggested wording: 

“Treatment selection is subject to medical assessment. Your physician may recommend a different treatment or treatment plan where clinically appropriate.” 

This will ensure that users understand that the treatment selected during booking is subject to the physician's clinical assessment. 

# **7. New Medical Disclaimer Page** 

**URL:** /medical-disclaimer 

A completely new dedicated page will be created for the full medical and legal disclaimer. 

This page will contain the relevant medical, clinical, and legal information and will be linked from the website footer. 

# **8. Medical Review Information on Treatment Pages** 

# **Status: NEW** 

Treatment pages will include doctor review information to provide additional transparency and trust. 

The format will be: 

“Medically reviewed by: Dr [Name], [Specialty] | Last reviewed: [Month Year]” 

The exact doctor name, specialty, and review date will be managed based on the approved medical review information. 

# **9. Permanent Cookie Settings Link** 

A permanent **“Cookie Settings”** link/button will be added to the footer. 

Users should be able to access their cookie preferences at any time and update their choices. 

# **10. Copyright and Legal Entity Information** 

A copyright line will be added at the bottom of the footer: 

“© 2026 Beauty Doctors. All rights reserved.” 

The Terms and Privacy pages should also include the company's actual registered legal entity name. 

**Existing Pages – Copy Updates and Functional Improvements** 

**11. Aesthetic Intelligence – Blog Page** 

The **“Aesthetic Intelligence”** section already exists on the /blog page. 

This is therefore a **copy update only** , not a new section. 

# **Current subtitle:** 

“Expert treatment guides, clinical science, and beauty philosophy from our leading aesthetic professionals.” 

# **New subtitle:** 

“Expert treatment guides, clinical insights and aesthetic medicine perspectives.” 

# **12. Messages – Unread Badge** 

The Messages section already exists in the client dashboard and navigation. 

The new requirement is to add an unread message counter. 

For example: 

# **Messages 2** 

The system will need to fetch the user's unread message count and display the badge next to the Messages navigation item. 

The badge should update appropriately when messages are read. 

# **13. Mobile Account Navigation** 

The existing personal account navigation is already available on both desktop and mobile through ClientLayout.tsx. 

The new requirement is to improve the mobile experience because the current navigation can become cramped when there are several options. 

Possible implementation: 

- A **My Account** drawer/menu, or 

- A horizontally scrollable navigation with a clear visual indicator showing that additional options are available. 

The goal is to make sure all account options remain accessible without making the mobile interface crowded. 

# **14. Privileges Page – Copy Update** 

The /services page already exists and is linked from the header. 

This is a **copy update only** . 

# **Current title:** 

“EXPLORE SERVICES” 

# **New title:** 

# “EXPLORE PRIVILEGES” 

# **New subtitle:** 

“Discover services and benefits designed to make your Beauty Doctors experience easier, more convenient and better connected.” 

So, this page does not need to be rebuilt. Only the existing copy needs to be updated. 

# **Summary of Existing vs New Requirements** 

# **Existing pages/sections with copy updates** 

- Aesthetic Intelligence section on /blog 

- Privileges page /services 

These already exist and only require text/title changes. 

# **New functional/UI work** 

- Unread Messages badge 

- Mobile account navigation improvement 

- Clinical Principles homepage section 

- Medical assessment notices 

- Medical review badges 

- Cookie Settings link 

- New Medical Disclaimer page 

- New For Clinics & Partners page 

- Top Utility Bar 

- Treatments 3-column mega menu 

# **Gift Cards – Medical Service Restrictions** 

Gift Cards require an additional technical restriction because gift cards for medical services are prohibited by law. They may be permitted for certain non-medical aesthetic services, such as hair removal, subject to legal confirmation. 

Because of this, the system should not rely only on displaying a disclaimer. The restriction should be enforced directly within the application. 

# **15. Gift Card Eligibility Per Service** 

Yes, this can technically be implemented as a simple **YES / NO** option for every service. 

Each service in the admin panel should have a field: 

# **Gift Card Eligible: YES / NO** 

The default value for every new service should be: 

# **NO** 

This means a newly created treatment or service will never automatically become available for Gift Cards. 

Only services that have been specifically reviewed and approved as eligible non-medical services can be changed to: 

**YES** 

# **16. Gift Card Service Selection** 

The Gift Card service selection should only display services where: 

# **Gift Card Eligible = YES** 

Medical treatments should not appear in the Gift Card service selection at all. 

They should also not be: 

- Selectable 

- Purchasable through Gift Cards 

- Redeemable through Gift Cards 

- Accessible through a manipulated frontend request 

The backend should enforce the same restriction so that the rule cannot be bypassed by directly calling an API. 

# **17. Gift Card Whitelist** 

The Gift Card page should display only the services that have been explicitly approved. 

For example, aesthetic hair removal could potentially be included, but only after the lawyer confirms that the specific service and the way it is provided fall within the permitted non-medical category. 

This effectively creates a whitelist of approved Gift Card services. 

# **18. Gift Card Frontend Message** 

The Gift Cards page should clearly display the following message: 

“Beauty Doctors Gift Cards are available exclusively for selected non-medical aesthetic services.” 

This provides transparency to customers while the actual eligibility restriction is enforced technically in the system. 

# **Recommended Technical Logic** 

The Gift Card eligibility should be controlled at both the **frontend and backend** levels. 

# **Admin Panel** 

Each service: 

**Gift Card Eligible:** 

YES / NO 

Default: 

NO 

# **Frontend** 

Only services with: 

giftCardEligible = YES 

should be displayed. 

# **Backend** 

The backend should validate the service before: 

- Creating a Gift Card purchase 

- Applying a Gift Card 

- Redeeming a Gift Card 

- Adding a service to a Gift Card order 

If the service is not eligible, the API should reject the request even if someone attempts to bypass the frontend. 

This ensures that medical services cannot accidentally become available through Gift Cards due to a frontend issue or manipulated request. 

# **Additional Legal, Payment, Security and Platform Requirements** 

# **1. Gift Card Terms & Conditions** 

The Terms & Conditions should clearly state the following: 

“Gift Cards cannot be redeemed for medical procedures, medical treatments or medical consultations. Eligible services are specifically identified within the platform.” 

This should be consistent with the technical Gift Card restrictions implemented across the platform. 

# **2. Rename “Digital Wallet”** 

The existing **“Digital Wallet”** section should be renamed to: 

# **“Payments & Invoices”** 

The functionality should continue to provide users with access to their payment-related information, invoices, and transaction history. 

# **3. Privileges – Payments & Invoices** 

Within the Privileges page, the existing card should be updated to reflect the new wording: 

“View your payments, invoices and transaction history across participating clinics.” 

# **4. Remove International Clinics from Privileges** 

The **“International Clinics”** card should be removed or hidden from the Privileges page. 

International Clinics is not considered a member privilege. 

This functionality is intended to be integrated later into the clinic/network search functionality once active international clinic partnerships are established. 

# **New Functional and Backend Requirements** 

The following features are not simple UI changes. They are part of the overall technical architecture and backend development of the platform: 

- Direct Clinic Merchant Payment Routing 

- Clinic-Branded Invoicing 

- Gift Card Database Restriction Engine 

- Real-Time Messages Unread Counter 

These requirements will involve backend logic, database changes, API development, security considerations, and frontend integration. 

# **5. Email Change Verification** 

# **Status: NEW** 

When a user changes their email address, the new email address must be verified before it becomes active. 

# **Required flow:** 

1. User enters a new email address. 

2. The system sends a verification email/link to the new address. 

3. The new email remains unverified until the user completes the verification. 

4. The new email address becomes active only after successful verification. 

The existing email address should remain active until the new address has been successfully verified. 

# **6. Phone Number Change Verification** 

# **Status: NEW** 

When a user changes their phone number, the new number must be verified using an SMS OTP. 

# **Required flow:** 

1. User enters a new phone number. 

2. The system sends a verification code via SMS. 

3. User enters the OTP. 

4. The system validates the OTP. 

5. The new phone number becomes active only after successful verification. 

This functionality will require an SMS provider/service to send OTP messages. 

# **7. Direct Clinic Payment Routing** 

**Status: NEW – Backend / Payment Architecture** 

When a patient makes a payment for a clinic or doctor's service, the payment should not be routed into a general Beauty Doctors account where possible. 

Instead, the payment should be routed directly to the relevant participating doctor or clinic's own merchant/bank/payment account. 

For example: 

**Patient → Payment Platform → Participating Clinic / Doctor** 

rather than: 

**Patient → Beauty Doctors → Clinic** 

The exact implementation will depend on the supported payment provider and its marketplace/split-payment capabilities. 

The system should maintain the necessary transaction reference and payment status while ensuring that the correct clinic is associated with each transaction. 

# **8. Clinic / Doctor Branded Invoices** 

# **Status: NEW** 

Patient receipts and invoices should not appear as generic Beauty Doctors invoices when the transaction relates to a specific clinic or doctor. 

Instead, the invoice should be generated using the official information of the relevant clinic or doctor. 

The invoice should be available in the patient's account for viewing and downloading. 

Depending on the clinic's legal and tax setup, the invoice may include: 

- Clinic/Doctor legal name 

- Address 

- VAT/tax information where applicable 

- Invoice number 

- Date 

- Patient/customer information where legally required 

- Services provided 

- Amount paid 

- Payment method 

# • Relevant tax information 

The exact invoice format should follow the applicable legal and accounting requirements. 

# **9. Gift Card System Blocking** 

**Status: NEW – Database + Admin + Backend** 

The Gift Card eligibility system should be enforced at database, admin-panel, frontend, and backend levels. 

Each service should have a: 

# **Gift Card Eligible: YES / NO** 

field. 

# **Default value:** 

# **NO** 

This means every newly created treatment/service is automatically considered **not eligible** for Gift Cards. 

Only services that have been specifically approved as eligible non-medical services can be changed to: 

# **YES** 

Medical treatments must not be selectable or redeemable through the Gift Card system. 

The backend must also validate this restriction so that users cannot bypass the frontend and redeem a Gift Card against an ineligible service through a direct API request. 

# **10. Real-Time Messages Unread Counter** 

# **Status: NEW** 

A real-time unread message counter should be added to the Messages navigation item. 

For example: 

# **Messages 2** 

When a new message is received from a doctor or team member, the unread count should update without requiring the user to manually refresh the page. 

The system should: 

- Track unread messages 

- Display the current unread count 

- Update the count when a new message arrives 

- Decrease/remove the count when messages are read 

- Keep the count synchronised across relevant sessions/devices where applicable 

The implementation will be part of the messaging backend and real-time communication architecture. 

# **Major Technical Architecture & GDPR Security** 

The messaging and medical-document functionality involves potentially sensitive information and therefore requires appropriate security controls. 

# **11. GDPR Special Category Data Protection** 

Messages and medical attachments should be protected both: 

- **In transit** , using secure encrypted connections such as HTTPS/TLS 

- **At rest** , using appropriate encryption/security mechanisms for stored data 

Medical attachments should not be publicly accessible through direct URLs. 

Access should be controlled through authenticated and authorised requests. 

# **12. Access Logging & Audit Trail** 

The system should maintain an audit trail for sensitive actions. 

For example, the system should be able to record: 

- Which doctor or authorised clinic user accessed a conversation 

- Which user accessed the conversation 

- When the conversation was opened 

- Relevant access/action information 

- Other sensitive actions where required for compliance 

The audit records should be protected from unauthorised modification. 

# **13. Strict Clinic Data Isolation** 

Each clinic must have strict data isolation. 

A clinic should only be able to access conversations, patients, attachments, and other information that it is authorised to access. 

One clinic must never be able to access another clinic's messages or medical attachments. 

This isolation should be enforced at the backend/API and database access levels, not only through frontend permissions. 

# **14. GDPR Consent Audit Logging** 

A dedicated **GDPR Consent Audit Log** should be implemented in the database. 

Whenever a user changes a consent-related toggle, the system should record the relevant event. 

For example: 

- Consent given 

- Consent withdrawn/revoked 

- Date and time of the action 

- Relevant consent type 

- User/account reference 

- Previous state and new state where appropriate 

This provides a historical record showing when consent was given or withdrawn. 

The audit history should not simply overwrite the previous value. Each relevant consent change should create a new audit event. 

# **General Legal Pages Implementation** 

# **15. CMS-Managed Legal Pages** 

All legal pages should be created as **CMS-managed pages** , rather than hard-coded directly into the application. 

This will allow authorised administrators to manage the legal content without requiring a new application deployment for every legal-text update. 

Each legal page must support: 

- English (EN) 

- Greek (EL) 

- Last Updated date 

- Version number 

- Version history 

The legal content should be version-controlled so that previous versions can be retained for reference and audit purposes. 

# **16. English Master Copy and Greek Translation** 

For the initial implementation, the **English version will be used as the master legal copy** . 

The final Greek legal translation should be based on the lawyer-approved English version. 

This means we should avoid maintaining two independently changing legal drafts. 

The recommended workflow is: 

**Lawyer-approved English version → Greek translation → Published EN + EL versions** 

Any future legal changes should first be approved in the English master copy and then reflected in the Greek version. 

# **Company Details** 

The following company information should be used consistently across the legal pages, footer, invoices, and other relevant official areas of the platform where legally appropriate: 

**Legal Company Name:** 

Beautydoctors O.E. 

# **Registered Address:** 

23 Xanthippou Street, Pikermi, 19009, Greece 

**VAT No.:** 

803040724 

**G.E.MI. No.:** 188015103000 

**Email:** 

<u>info@beautydoctors.gr</u> 

# **Telephone:** 

+30 211 218 4564 

This information should remain consistent across the Terms & Conditions, Privacy Policy, Medical Disclaimer, Cookie Policy, and other applicable legal pages. 

# **1. ABOUT BEAUTY DOCTORS** 

# **New Page** 

**URL:** /about-us 

**Menu / Footer Label: ABOUT US** 

# **Page Copy** 

# **ABOUT BEAUTY DOCTORS** 

# **A clearer way to explore aesthetic and medical care.** 

Beauty Doctors is a digital platform operated by **Beautydoctors O.E.** that connects users with participating doctors, clinics and aesthetic service providers. 

Through Beauty Doctors, users can explore available treatments and services, discover participating providers, request or schedule appointments, communicate with doctors or clinics through the platform, and manage information related to their appointments and activity. 

Beauty Doctors does not replace the treating physician and does not independently diagnose medical conditions, determine the medical suitability of a treatment, or provide medical treatment. 

Medical assessment, diagnosis, treatment suitability, treatment planning, and the provision of medical services remain the responsibility of the relevant healthcare professional or clinic. 

When a user selects a medical treatment through the platform, that selection represents the treatment the user is interested in. The final treatment decision and treatment plan are determined by the treating physician following appropriate medical assessment. 

Our aim is to make access to information, professionals and services easier and more transparent while preserving the independent clinical judgment of each healthcare professional. 

# **HOW IT WORKS** 

**Explore a treatment → Choose a doctor or clinic → Select a date → Medical assessment → Final treatment plan** 

For questions regarding your account, appointments or use of the platform, you can contact **Beauty Doctors Support** . 

Questions concerning diagnosis, medical suitability, treatment or clinical care should be addressed to the relevant doctor or clinic. 

# **2. TERMS OF USE** 

# **New Page** 

**URL:** /terms-of-use 

# **Footer Label: TERMS OF USE** 

# **Page Copy** 

# **TERMS OF USE** 

# **Last Updated:** [DATE] 

These Terms of Use govern access to and use of the Beauty Doctors website, application and related digital services operated by **Beautydoctors O.E.** , with registered office at **23 Xanthippou Street, Pikermi, 19009, Greece** , VAT No. **803040724** and G.E.MI. No. **188015103000** . 

By creating an account or using the Beauty Doctors platform, you agree to these Terms of Use. If you do not agree with these Terms, you should not use the platform. 

# **1. Role of Beauty Doctors** 

Beauty Doctors operates a digital platform that facilitates access to information and interaction between users and participating doctors, clinics and other eligible service providers. 

Beauty Doctors provides the digital infrastructure for functions such as treatment discovery, provider discovery, appointment management, communication and account management. 

Beauty Doctors is not, solely by reason of operating the platform, the healthcare professional providing a medical service. 

# **2. Medical Services and Clinical Decisions** 

Medical assessment, diagnosis, determination of treatment suitability, prescription, treatment planning and the provision of medical procedures are performed by the relevant healthcare professional or clinic. 

Information displayed on the platform does not constitute a diagnosis and does not mean that a particular treatment is medically suitable for a specific user. 

Selecting a treatment through Beauty Doctors indicates a **Treatment of Interest** . 

The treating physician may: 

- Confirm the proposed treatment; 

- Recommend a different treatment; 

- Recommend a different treatment plan; or 

- Decide that the treatment is not appropriate, 

following the appropriate medical assessment. 

# **3. Participating Doctors and Clinics** 

Doctors and clinics available through Beauty Doctors are responsible for the healthcare services they provide, their clinical judgment, professional obligations and compliance with applicable healthcare legislation and professional standards. 

Beauty Doctors may provide information supplied by participating providers, including availability, locations, services and indicative or starting prices. 

Where information changes, the information confirmed by the provider at the time of the appointment or medical assessment shall prevail. 

# **4. User Accounts** 

Users are responsible for providing accurate and current account information and for maintaining the confidentiality of their login credentials. 

You must notify Beauty Doctors without undue delay if you believe that your account has been accessed or used without authorization. 

You may not: 

- Use another person's account; 

- Impersonate another person; 

- Use the platform for unlawful purposes; 

- Use the platform for abusive, fraudulent or misleading activities. 

# **5. Appointments** 

Beauty Doctors allows users to request, schedule, manage or cancel appointments with participating doctors and clinics. 

An appointment confirmation confirms the appointment, not the medical suitability or final approval of a treatment. 

Appointment availability, rescheduling, cancellation and no-show policies may vary by provider. 

Any provider-specific policy that creates a financial obligation must be clearly disclosed to the user before the relevant booking or transaction. 

# **6. Payments for Medical Services** 

Payments for medical services are made directly to the doctor or clinic providing the relevant service. 

Beauty Doctors does not receive or hold the payment made for the medical service itself. 

The doctor or clinic is responsible for the provision of the service and for issuing the applicable receipt, invoice or other fiscal document. 

Where Beauty Doctors displays payment history or related transaction information in a user's account, such display is provided for convenience and does not change the identity of the provider receiving the payment. 

# **7. Gift Cards** 

Beauty Doctors may issue Beauty Doctors Gift Cards under separate Gift Card Terms. 

Gift Cards are available exclusively for eligible non-medical aesthetic services that are specifically identified as **Gift Card Eligible** within the platform. 

Gift Cards may not be redeemed for: 

- Medical consultations 

- Injectable medical treatments 

- Medical procedures 

- Surgical procedures 

- Any other service classified as a medical act 

The purchase and use of Gift Cards are governed by the separate **Gift Card Terms** available on the platform. 

# **8. Messaging** 

Beauty Doctors may enable users to communicate with participating doctors or clinics and, separately, with Beauty Doctors Support. 

Beauty Doctors Support provides assistance relating to the platform, accounts, appointments and other administrative matters. Beauty Doctors Support does not provide medical diagnosis or medical treatment. 

Messages sent to a doctor or clinic may contain health-related information. Users should share only information that is relevant to their care and should follow the privacy notices and instructions presented by the platform. 

The messaging function is **not an emergency medical service** and must not be used when immediate medical assistance is required. 

# **9. Feedback and Reviews** 

Beauty Doctors may allow users to provide feedback following a completed appointment. 

Feedback must reflect the user's genuine experience and must not contain unlawful, abusive, defamatory, discriminatory or intentionally misleading material. 

Beauty Doctors may moderate or remove content where reasonably necessary for legal, privacy, safety or platform integrity reasons. 

Publication of medical testimonials, treatment results or other health-related user content may be subject to additional legal and professional restrictions. 

# **10. Information and Content** 

Treatment descriptions, articles and other informational content available through Beauty Doctors are provided for general informational purposes. 

Such content does not replace individual medical assessment, diagnosis or medical advice. 

Users should not use platform content to self-diagnose a medical condition or independently determine that a particular medical procedure is appropriate for them. 

Any decision regarding diagnosis, treatment suitability or medical care should be made with the relevant healthcare professional. 

# **11. Acceptable Use** 

Users must not attempt to interfere with the security or operation of the Beauty Doctors platform. 

Users must not: 

- Attempt to gain unauthorized access to accounts, systems or data; 

- Upload malicious code, viruses or other harmful material; 

- Scrape restricted information; 

- Misuse personal data; 

- Circumvent platform security or access controls; 

- Interfere with the normal operation of the platform; or 

- Use the service for unlawful purposes. 

Beauty Doctors may temporarily restrict or suspend access where reasonably necessary to protect users, participating providers, platform security or legal compliance. 

# **12. Account Deletion** 

Users may request deletion of their Beauty Doctors account through the available account settings or by contacting Beauty Doctors. 

Deletion of a Beauty Doctors account does not necessarily result in deletion of medical records or other information independently held by a doctor or clinic where that provider is legally required or otherwise entitled to retain such information. 

Personal data processed by Beauty Doctors will be handled in accordance with the **Privacy Policy** and applicable data protection law. 

# **13. Platform Availability** 

Beauty Doctors aims to provide reliable access to the platform but does not guarantee uninterrupted availability. 

Temporary interruptions may occur due to maintenance, security measures, technical failures, external service providers or circumstances beyond reasonable control. 

# **14. Intellectual Property** 

The Beauty Doctors name, branding, software, interface, databases, original content and other protected material belong to **Beautydoctors O.E.** or are used under appropriate authorization. 

Users may access and use the platform for personal and lawful purposes but may not copy, reproduce, commercially exploit or distribute protected platform material without appropriate authorization. 

# **15. Responsibility for Medical Services** 

The healthcare professional or clinic providing a medical service remains responsible for the professional and clinical aspects of that service. 

Nothing in these Terms limits any mandatory rights of a consumer or patient, or excludes liability where such liability cannot lawfully be excluded. 

# **16. Consumer Rights** 

These Terms do not limit mandatory rights granted to consumers under applicable Greek or European Union law. 

Where a transaction concluded through the platform is subject to statutory withdrawal, cancellation, refund or information rights, those rights remain fully applicable. 

# **17. Changes to the Terms** 

Beauty Doctors may update these Terms where reasonably necessary due to changes in the platform, services, legislation or regulatory requirements. 

The current version and date of the Terms will always be available through the platform. 

Where a material change requires renewed user acceptance, the platform may request such acceptance before continued use of the affected service. 

# **18. Applicable Law** 

These Terms are governed by applicable Greek law and European Union law. 

Nothing in this section deprives a consumer of mandatory protections or jurisdictional rights granted by applicable consumer legislation. 

# **19. Contact** 

For questions regarding these Terms or the operation of the platform: 

# **Beautydoctors O.E.** 

23 Xanthippou Street Pikermi 19009, Greece 

**VAT No.:** 803040724 **G.E.MI. No.:** 188015103000 **Email:** <u>info@beautydoctors.gr</u> **Telephone:** +30 211 218 4564 

# **PRIVACY POLICY** 

**URL:** /privacy-policy 

**Footer Label: PRIVACY POLICY** 

# **Last Updated:** [DATE] 

Beautydoctors O.E. respects the privacy of users of the Beauty Doctors platform and processes personal data in accordance with applicable data protection legislation, including the **General Data Protection Regulation (GDPR)** . 

This Privacy Policy explains what information may be processed when you use Beauty Doctors, why it is used, with whom it may be shared, and what rights you have. 

# **PRIVACY POLICY** 

**Last Updated:** [DATE] 

# **1. Who We Are** 

For personal data relating to the operation of the Beauty Doctors platform, the relevant entity is: 

**Beautydoctors O.E.** 23 Xanthippou Street, Pikermi 19009, Greece **VAT No.:** 803040724 **G.E.MI. No.:** 188015103000 **Email:** <u>info@beautydoctors.gr</u> **Telephone:** +30 211 218 4564 

The exact data-protection roles between Beauty Doctors and participating doctors or clinics may differ depending on the processing activity. Participating healthcare providers may act independently in relation to medical care and medical records for which they are legally responsible. 

**Developer Note:** This paragraph must remain CMS-editable because the final controller/processor allocation must be confirmed by the lawyer after the provider agreements are finalized. 

# **2. Information We May Process** 

Depending on how you use Beauty Doctors, the information we may process can include: 

- Account details, such as your name, email address and telephone number; 

- Appointment details; 

- The doctor or clinic selected; 

- Communications and messages; 

- Files uploaded by the user; 

- Payment and invoice metadata; 

- Gift Card information; 

- Feedback; 

- Marketing preferences; 

- Security information; 

- Device and technical data; and 

- Cookie information. 

Where a user communicates with a doctor or clinic, messages or attachments may also contain information concerning health, treatments, medical history, photographs, examinations or other information that may constitute health data. 

# **3. Why We Use Personal Data** 

Personal data may be processed for purposes including: 

- Creating and administering your account; 

- Enabling appointment functionality; 

- Facilitating communication with doctors and clinics; 

- Providing customer support; 

- Maintaining platform security; 

- Displaying your transaction history; 

- Administering eligible Gift Cards; 

- Managing feedback; and 

- Operating and maintaining the platform. 

Information may also be processed where required to comply with legal obligations, establish or defend legal claims, prevent fraud, or protect the security and integrity of the service. 

Marketing communications are handled separately and are sent only where permitted by applicable law. 

# **4. Health Information** 

Health-related information is treated with particular care. 

When you communicate health information to a doctor or clinic through Beauty Doctors, that information should be limited to what is reasonably relevant to your care. 

The relevant healthcare professional or clinic may process health information for medical assessment or healthcare in accordance with the legal basis applicable to the provision of healthcare and the professional confidentiality obligations that apply to that provider. 

Beauty Doctors processes health-related information only to the extent necessary to operate the relevant platform function, provide secure communication, or fulfil other lawful and specifically identified purposes. 

**Developer Note:** The final Article 6 and Article 9 GDPR legal bases must be validated by the lawyer before publication. 

# **5. Doctors and Clinics** 

Information necessary for an appointment or communication may be made available to the doctor or clinic selected by the user. 

A participating doctor or clinic should not automatically receive information relating to services received by the same user from unrelated providers unless a valid legal basis and appropriate user-facing process exists. 

# **6. Payments** 

For medical services, payment is made directly to the relevant doctor or clinic. 

Beauty Doctors may process or display transaction metadata necessary for the operation of the platform, such as the provider, date, amount and payment status, but does not receive or hold the payment made for the medical service itself. 

Payment providers may process payment information under their own legal and security obligations. 

# **7. Messages and Attachments** 

Messages exchanged through the platform may be stored as necessary to provide the messaging service, maintain security, and support communication between the user and the intended recipient. 

Users should not upload identification documents, financial information, or unrelated sensitive information unless specifically required for a legitimate purpose. 

Beauty Doctors messaging is not intended for medical emergencies. 

# **8. Marketing Communications** 

Beauty Doctors may offer optional email newsletters, promotional SMS, or similar communications. 

Marketing preferences are separate from essential account, security, appointment, and service notifications. 

Users can change their marketing preferences or unsubscribe at any time without affecting access to the platform or healthcare services. 

# **9. Cookies and Similar Technologies** 

Beauty Doctors uses necessary cookies and may use optional analytics, preference, or marketing technologies as described in the **Cookie Policy** . 

Optional cookies are activated in accordance with the user's cookie choices and applicable law. 

# **10. Recipients and Service Providers** 

Personal data may be disclosed where necessary to: 

- Participating doctors or clinics selected by the user; 

- Hosting and IT providers; 

- Communications providers; 

- Payment service providers; 

- Security providers; and 

- Professional advisers. 

Service providers acting on behalf of Beauty Doctors must process personal data in accordance with applicable contractual and legal requirements. 

# **11. International Transfers** 

Where personal data is transferred outside the European Economic Area, Beauty Doctors will use an appropriate lawful transfer mechanism where required. 

**Developer Note:** The actual infrastructure, hosting arrangements, and subprocessors must be mapped before publication. 

# **12. Data Retention** 

Personal data is retained only for as long as necessary for the relevant purpose or as required by applicable law. 

Different categories of data may have different retention periods. 

Medical records maintained independently by doctors or clinics may be subject to separate legal retention obligations. 

**Developer Note:** The lawyer-approved retention schedule must be inserted before launch. 

# **13. Security** 

Beauty Doctors applies appropriate technical and organizational measures designed to protect personal data against unauthorized access, loss, alteration, disclosure, or misuse. 

No digital system can be guaranteed to be completely risk-free. Users should also protect their account credentials and notify Beauty Doctors promptly if they suspect unauthorized access to their account. 

# **14. Your Rights** 

Subject to applicable law, users may have rights including: 

- Access to their personal data; 

- Correction of inaccurate information; 

- Deletion; 

- Restriction of processing; 

- Data portability; 

- Objection to certain processing; and 

- Withdrawal of consent where processing is based on consent. 

Requests may be sent to: 

**<u>info@beautydoctors.gr</u>** 

Users also have the right to lodge a complaint with the competent data protection supervisory authority. 

# **15. Account Deletion** 

Users may request deletion of their Beauty Doctors account. 

Account deletion does not automatically delete information that an independent doctor or clinic is required or entitled to retain under applicable medical or legal obligations. 

# **16. Changes to This Privacy Policy** 

The Privacy Policy may be updated to reflect changes to the platform, processing activities, or applicable law. 

The current version and **Last Updated** date will always be available through Beauty Doctors. 

# **17. Contact** 

Privacy enquiries may be sent to: 

**Beautydoctors O.E. Email:** <u>info@beautydoctors.gr</u> **Telephone:** +30 211 218 4564 

# **MEDICAL DISCLAIMER** 

**URL:** /medical-disclaimer 

**Last Updated:** [DATE] 

The content available through Beauty Doctors is provided for general informational purposes and does not replace individual medical assessment, diagnosis, medical advice, or treatment by an appropriately qualified healthcare professional. 

Treatment descriptions, articles, photographs, expected timelines, and other information describe treatments or services in general terms. They do not establish that a particular treatment is appropriate for a specific individual. 

The suitability of any medical treatment, procedure, or treatment plan is determined by the treating physician following appropriate assessment of the patient's medical history, individual characteristics, needs, and other clinically relevant factors. 

Selecting a treatment through Beauty Doctors represents the user's **Treatment of Interest** . It does not constitute a medical diagnosis, prescription, or confirmation that the treatment will be performed. 

Individual response to a treatment may vary. Expected results, duration of results, recovery time, side effects, and other outcomes may differ between patients, and no specific medical or aesthetic result is guaranteed. 

Beauty Doctors does not provide emergency medical services. The platform and its messaging functions must not be used where urgent or emergency medical assistance is required. 

# **BEAUTY DOCTORS GIFT CARD TERMS** 

**URL:** /gift-card-terms 

**Last Updated:** [DATE] 

This page must also be linked directly from the **Gift Card purchase page before Checkout** . 

# **1. Issuer** 

Beauty Doctors Gift Cards are issued by: 

**Beautydoctors O.E.** 23 Xanthippou Street, Pikermi 19009, Greece **VAT No.:** 803040724 **G.E.MI. No.:** 188015103000 

# **2. Eligible Services** 

Beauty Doctors Gift Cards may be redeemed exclusively for services that are specifically marked within the platform as **Gift Card Eligible** . 

Gift Card eligibility is limited to selected non-medical aesthetic services. 

# **3. Excluded Services** 

Beauty Doctors Gift Cards cannot be redeemed for medical consultations, injectable medical treatments, medical procedures, surgery, or any other service classified as a medical act. 

A Gift Card does not entitle its holder to obtain any medical treatment and cannot be converted into payment or credit for a medical service. 

# **4. Validity** 

A Beauty Doctors Gift Card is valid for **two (2) months from its date of issue** . 

The expiry date must be clearly displayed at the time of purchase and within the Gift Card details. 

**Developer Requirement:** The validity period must be editable through the CMS/admin and must not be hard-coded. 

# **5. Gift Card Value** 

The available value of the Gift Card is the amount displayed at the time of purchase. 

A Gift Card may only be used with participating providers and for eligible services available through the Beauty Doctors Gift Card programme. 

# **6. Redemption** 

The Gift Card code must be valid and unused, or have sufficient remaining balance, at the time of redemption. 

Where the system supports partial redemption, any remaining balance may continue to be used for eligible services until the Gift Card expires. 

**Developer Requirement:** Confirm whether partial redemption is enabled before publication. If it is not enabled, this paragraph must be removed. 

# **7. No Cash Redemption** 

Gift Cards cannot be exchanged for cash and cannot be used to obtain cash advances. 

# **8. Statutory Consumer Rights** 

Nothing in these Gift Card Terms limits mandatory consumer rights under applicable Greek or European Union law. 

Where a statutory right of withdrawal applies to an online Gift Card purchase, that right will apply in accordance with applicable law. 

# **9. Lost, Stolen or Misused Codes** 

Users should protect their Gift Card code. 

Beauty Doctors may suspend or refuse a Gift Card where there are reasonable indications of fraud, unauthorized use, or technical error, subject always to mandatory consumer rights. 

# **10. Provider Availability** 

The availability of a particular eligible service or participating provider may change during the validity period of the Gift Card. 

Beauty Doctors will make available the current list of eligible non-medical services within the platform. 

# **11. Contact** 

Questions about a Beauty Doctors Gift Card may be sent to: 

**Email:** <u>info@beautydoctors.gr</u> **Telephone:** +30 211 218 4564 

# **COOKIE POLICY** 

**URL:** /cookie-policy 

# **Last Updated:** [DATE] 

Beauty Doctors uses cookies and similar technologies to operate the website and application, maintain user sessions, remember preferences, understand how the service is used and, where the user chooses, support analytics or marketing functionality. 

# **1. Necessary Cookies** 

Necessary cookies are required for core platform functions such as authentication, security, session management, cookie preferences, and other services requested by the user. 

These technologies may operate without optional marketing or analytics consent where permitted by applicable law. 

# **2. Analytics Cookies** 

Analytics technologies help Beauty Doctors understand how users interact with the platform and improve performance and content. 

Where consent is required, analytics cookies remain disabled until the user chooses to enable them. 

# **3. Preference Cookies** 

Preference technologies may remember settings selected by the user, such as language or interface choices. 

Their use depends on the nature of the relevant technology and applicable consent requirements. 

# **4. Marketing Cookies** 

Marketing and advertising technologies may be used to measure campaigns, understand advertising effectiveness, or provide relevant promotional communications. 

Where consent is required, these technologies remain disabled until the user actively enables them. 

# **5. Third-Party Technologies** 

Certain functions may depend on third-party providers. 

Where such providers place cookies or similar technologies, information about the provider, purpose, and duration must be included in the active cookie inventory. 

# **6. Managing Cookie Preferences** 

Users can accept, reject, or adjust optional cookie categories through the Beauty Doctors cookie preference tool. 

A permanent **Cookie Settings** link must remain available in the footer so users can change or withdraw their choices later. 

# **7. Cookie Inventory** 

**Developer Requirement:** The final published Cookie Policy must include an automatically maintainable or CMS-managed table showing: 

# **Cookie / Technology Name Provider Purpose Category Duration** 

Do not publish placeholder Google, Meta, or other vendor names unless those services are actually installed. 

# **7. SIGN-UP LEGAL TEXT** 

At registration, add: 

# ☐ **I have read and agree to the Terms of Use and acknowledge the Privacy Policy.** 

The **Terms of Use** and **Privacy Policy** must be clickable. 

Do not combine this checkbox with newsletter or SMS marketing consent. 

# **Optional Marketing Consent** 

Add a separate optional checkbox: 

☐ **I would like to receive Beauty Doctors news, updates and promotional communications by email.** 

SMS consent must have its own separate option if SMS marketing is offered. 

The system must record the **date, time, and exact version of the Terms of Use accepted by the user** . 

# **8. MEDICAL PAYMENT NOTICE** 

Before a user confirms any payment relating to a medical service, display the following notice: 

**Payment is made directly to the clinic or doctor providing the service. Beauty Doctors does not receive or hold the payment for the medical service.** 

The payment confirmation screen must also clearly display: 

- **Provider / Clinic** 

- **Amount** 

- **Payment Type:** Deposit / Full Payment 

- **Appointment / Treatment of Interest** 

# **9. CLINICAL MESSAGING NOTICE** 

Before the first conversation with a doctor or clinic, display: 

# **HEALTH INFORMATION NOTICE** 

Messages to your doctor or clinic may contain health information. Please share only information that is relevant to your care. Messages and attachments are processed for the purpose of enabling your communication with the selected healthcare provider and are handled in accordance with the Privacy Policy. 

Please do not upload identification documents, financial information, or unrelated sensitive information unless specifically requested for a legitimate purpose. 

This messaging service is not intended for medical emergencies. 

**Link underneath:** 

**Privacy & Medical Data → Privacy Policy** 

# **Beauty Doctors Support Notice** 

For Beauty Doctors Support, display the following separately: 

**Beauty Doctors Support can assist with your account, appointments and use of the platform. Beauty Doctors Support does not provide medical diagnosis or treatment advice.** 

# **10. FOOTER — FINAL STRUCTURE** 

Create the following footer groups: 

# **COMPANY** 

- About Us 

- Contact 

- Support 

# **LEGAL** 

- Terms of Use 

- Privacy Policy 

- Cookie Policy 

- Medical Disclaimer 

- Gift Card Terms 

- Cookie Settings 

# **Footer Copyright** 

**© 2026 Beauty Doctors. Operated by Beautydoctors O.E. All rights reserved.** 

Then display: 

**Beautydoctors O.E. · VAT 803040724 · G.E.MI. 188015103000 · 23 Xanthippou Street, Pikermi 19009, Greece** 

# **11. CMS / VERSION CONTROL** 

**Developer Requirement — Not visible to users** 

The following legal pages must all be editable through the CMS: 

- Terms of Use 

- Privacy Policy 

- Medical Disclaimer 

- Gift Card Terms 

- Cookie Policy 

Every legal page must store: 

- Current version number 

- Last Updated date 

- Previous versions 

- Publication date 

# **Terms Acceptance** 

For Terms of Use acceptance, store: 

- User ID 

- Timestamp 

- Exact Terms version accepted 

# **Marketing Preferences** 

Store email and SMS marketing preferences separately, including: 

- Opt-in / opt-out status 

- Timestamp 

# **Cookie Consent** 

The system must retain the user's current cookie choices and allow the user to withdraw or change those choices through **Cookie Settings** . 

# **12. GIFT CARD — CATEGORY-BASED IMPLEMENTATION** 

There is a separate category for: 

- **Hair Removal** 

- **Aesthetic Treatments** 

The Gift Card can be linked to the checkout for these categories, with a clear notice underneath stating that the Gift Card can only be used for eligible services within these categories. 

This approach should allow any services added to these categories in the future to be covered by the Gift Card without requiring additional code changes. 

**Implementation Note:** The final Gift Card eligibility logic should be confirmed against the previously defined Gift Card Eligible restriction before development is finalized. 

# **13. NEXT APPOINTMENT SCHEDULING** 

If technically possible, the system should allow the next appointment to be scheduled directly after a completed treatment. 

For example: 

If a client has completed a **Hair Removal** treatment and has paid in full, the system should provide an option to book the client's next appointment directly. 

# **14. CLIENT DATA VISIBILITY FOR STAFF** 

When a client books an appointment themselves through the Beauty Doctors platform, **sales staff must not be able to see the client's personal details** . 

Sales staff should only be able to see: 

- That the appointment slot is occupied 

- The appointment time 

The administrator/owner must still be able to view the client's details. 

# **Reason for This Restriction** 

This requirement is intended to protect medical confidentiality and avoid confusion in the appointment confirmation process. 

The intended workflow is: 

- **Appointments booked through the Beauty Doctors platform:** confirmed by the doctor. 

- **Appointments booked directly through staff channels:** confirmed by the relevant staff member. 

Staff members may continue to access the names and client database of clients they have personally brought in and booked appointments for, as well as clients brought in by other members of the doctors' staff. 

However, when a client independently books an appointment through the Beauty Doctors platform, **sales staff must have no visibility of that client's personal information or client profile.** 

# **15. MEDICAL APP — MESSAGING PERMISSIONS** 

The medical app should support the ability to restrict who can initiate messages. 

The proposed requirement is: 

- Clients should not be able to initiate messages to doctors. 

- Clients should not be able to initiate messages to clinics. 

- Clients should not be able to initiate messages to the Super Admin. 

- Clients should not be able to initiate messages to sales persons. 

- Doctors, clinics, Super Admin, and sales persons should be able to initiate messages to the client. 

**Developer Requirement:** The exact messaging permissions and allowed sender/recipient combinations should be configurable so the final communication workflow can be confirmed before implementation. 

# **16. 🟡 MESSAGING → ONE-WAY NOTIFICATIONS**

**Status: VERIFIED & CONFIRMED (100% FEASIBLE)**

### Requirement:
We want to verify whether the existing Messaging functionality can operate as one-way only, from BeautyDoctors to the user, with no ability for the user to reply. It should be used only for:

- Appointment confirmations
- Reminders
- Appointment changes/cancellations
- Operational platform notifications

### Actions:
1. **Rename Messaging everywhere:** Rename "Messages" / "Messaging" everywhere to **"Notifications"** across client portals, app navigation, and headers.
2. **Remove all references to:**
   - "Chat"
   - "Secure messaging"
   - "Message your doctor"
   - "Direct communication"
3. **Enforce One-Way Architecture:**
   - Remove reply input box, send button, and attachments for end users / clients.
   - Restrict incoming client messaging on the backend API / websocket layer.
4. **Content & Legal Updates:**
   - Update **For Clinics** section (`ForClinics.tsx`): Remove 'Direct secure messaging with inquiring patients'.
   - Update **Terms of Use** (`TermsOfUse.tsx`): Replace Section 8 (Messaging) with Platform Notifications.
   - Update **Medical Disclaimer** (`MedicalDisclaimer.tsx`): Align messaging terminology to notifications.

# **17. 🟡 NOTIFICATION SETTINGS**

**Status: NEW**

### Requirement:
Settings should display only the channels that are actually functional. At launch, we want:

- **Email:** ON / user-selectable
- **In-App Notifications:** ON / user-selectable, only if the one-way notification center is implemented
- **SMS:** To be removed for now

Currently, Email, SMS, and App Notifications are displayed. The UI must be updated to remove SMS functionality and only keep the available options.

# **18. 🔴 CHANGE “OUR MEDICAL TEAM”**

**Status: NEW**

### Requirement:
Wherever wording such as:
“our medical team for personalized guidance”
appears, it should be replaced with:

- **EN:** Connect with participating doctors and clinics for medical assessment and personalized treatment planning.
- **GR:** Συνδεθείτε με συμμετέχοντες ιατρούς και κλινικές για ιατρική αξιολόγηση και εξατομικευμένο θεραπευτικό πλάνο.

BeautyDoctors should not be presented as the medical team itself providing personalized treatment.

# **19. 🔴 CLINIC AND DOCTOR TERMINOLOGY**

**Status: NEW**

### Requirement:
- **"Our Certified Clinics"**: Remove "our". "Certified" should only be used if there is an actual certification. Preferred wording: **"Participating Clinics"** or **"Verified Clinics"** (provided details are actually verified).
- **"Verified Doctors"**: Keep this. Since BeautyDoctors verifies credentials, the following are acceptable:
  - **"Verified Doctor"**
  - **"Verified Healthcare Professional"**
  - **"Credentials verified by BeautyDoctors"**
- **"Accredited"**: Must not be used without a specific basis. "Verified Accredited Provider" should be replaced with **"Verified Healthcare Professional"**.

# **20. 🟡 ONLINE PAYMENTS**

**Status: NEW**

### Requirement:
Online medical payments must remain disabled until provider payment accounts are connected. In production, the doctor/clinic must be the actual payee/beneficiary of the medical-service payment.

# **21. 🔴 GIFT CARDS — BACKEND HARD BLOCK**

**Status: NEW**

### Requirement:
Gift Cards must only be usable for services that the Admin has explicitly marked as non-medical / Gift Card Eligible. 
We want a field per service, for example:
**Gift Card Eligible: YES / NO**

Backend validation must reject Gift Card usage for:
- Medical consultation
- Injectable treatment
- Medical procedure
- Surgery
- Any service classified as medical

This must not be only a UI warning — it must be a real server/backend block.

# **22. 🔴 EMAIL MARKETING CONSENT**

**Status: NEW**

### Requirement:
For newsletter/promotional emails:
- **Default = OFF**
- The user must actively enable it.
- Store the date/time of the opt-in.
- The user must be able to disable it.
- An unsubscribe option must be available.

Transactional emails for booking, confirmation, cancellation, payment/refund, and account functionality must not depend on the marketing toggle.

# **23. 🔴 CONTACT FORM WARNING**

**Status: NEW**

### Requirement:
Below the contact form, replace the current wording with:

- **GR:** Με την υποβολή της φόρμας δηλώνετε ότι έχετε ενημερωθεί για την Πολιτική Απορρήτου. Παρακαλούμε μην καταχωρείτε ιατρικά δεδομένα ή άλλες ευαίσθητες πληροφορίες σε αυτή τη φόρμα.
- **EN:** By submitting this form, you acknowledge that you have read the Privacy Policy. Please do not include medical or other sensitive information in this form.

# **24. 🔴 SCIENTIFIC REVIEW WORDING**

**Status: NEW**

### Requirement:
The phrasing "Medically reviewed by: Dr. Scientific Board" gives the impression that an individual doctor performed the assessment. 
It must be replaced with:
**SCIENTIFIC REVIEW**
The informational content has been reviewed by the BeautyDoctors Scientific Board. The suitability of the treatment is assessed individually by the treating physician before any procedure is performed.

*Once the Medical Director is appointed, the following can be used:*
Scientific review: Dr. [NAME], [SPECIALTY]

# **25. 🔴 FOOTER — POSITIONING CHANGE**

**Status: NEW**

### Requirement:
Remove any wording that presents BeautyDoctors as directly providing treatments or medical care.

**New text:**
- **GR:** Η BeautyDoctors είναι ψηφιακή πλατφόρμα ενημέρωσης, αναζήτησης και κράτησης ραντεβού με ανεξάρτητους ιατρούς και κλινικές αισθητικής ιατρικής. Η καταλληλότητα κάθε θεραπείας αξιολογείται από τον εκάστοτε ιατρό.
- **EN:** BeautyDoctors is a digital platform for exploring treatments and booking appointments with independent doctors and clinics. Treatment suitability is determined by the treating healthcare professional following medical assessment.

# **26. 🟢 BOOK NOW — KEEP**

**Status: NEW**

### Requirement:
Do not remove "Book Now" from medical treatments.
Below or within the booking process, the following should be clearly stated:
> "Proceeding with the treatment requires a medical assessment and informed consent. The treating physician may confirm, modify, or decide not to perform the selected treatment."

# **27. 🟡 HELP CENTER — CANCELLATION**

**Status: NEW**

### Requirement:
If the 24-hour rule is not a universal BeautyDoctors policy, it should not be presented as a general rule. 
Update the Help Center cancellation text to reflect that policies depend on the clinic:

- **GR:** Μπορείτε να ζητήσετε αλλαγή ή ακύρωση του ραντεβού σας μέσω BeautyDoctors. Οι προθεσμίες και τυχόν χρεώσεις ακύρωσης καθορίζονται από την πολιτική του εκάστοτε ιατρού ή κλινικής και εμφανίζονται κατά τη διαδικασία κράτησης.
- **EN:** You can request to reschedule or cancel your appointment through BeautyDoctors. Cancellation deadlines and any applicable charges depend on the policy of the selected doctor or clinic and are displayed during booking.

# **28. 🔴 FOR CLINICS — CLAIMS CLEANUP**

**Status: NEW**

### Requirement:
On the For Clinics page, modify claims that represent BeautyDoctors as having direct control or ensuring 100% compliance:

- “All listings adhere strictly...” → **“All provider profiles are subject to BeautyDoctors onboarding and credential verification before activation.”**
- “Full GDPR Compliance” → **“Consent and data-management tools designed to support GDPR-compliant workflows.”**
- “Medical Verification within 24–48 hours” → **“Verification is typically completed within 24–48 business hours after all required documentation has been received.”**

# **29. 🔴 GREECE-ONLY LAUNCH**

**Status: NEW**

### Requirement:
For the initial launch, the public-facing platform should include Greece only.
Hide/deactivate all Cyprus providers and Cyprus locations from public search results, treatment pages, filters, maps, pricing, and booking. Existing Cyprus records may remain in the database/admin, but they must not be publicly visible or bookable until Cyprus is separately activated.

# **30. 🔴 GREEK TRANSLATION / LEGAL COPY CLEANUP**

**Status: NEW**

### Requirement:
Avoid automatic, literal translation of legal and medical texts.
Greek and English legal/medical copy should consist of two separately approved texts, rather than machine translations.

Specific translation rules:
- BeautyDoctors → never translate as “Γιατροί Ομορφιάς”
- ROLE OF BEAUTY DOCTORS → Ο ΡΟΛΟΣ ΤΗΣ BEAUTYDOCTORS (never "Ο ΡΟΛΟΣ ΤΩΝ ΓΙΑΤΡΩΝ ΟΜΟΡΦΙΑΣ")
- TREATMENT OF INTEREST → ΘΕΡΑΠΕΙΑ ΕΝΔΙΑΦΕΡΟΝΤΟΣ or ΕΚΔΗΛΩΣΗ ΕΝΔΙΑΦΕΡΟΝΤΟΣ ΓΙΑ ΘΕΡΑΠΕΙΑ
- Doctor → Ιατρός
- Clinic → Κλινική
- Booking → Κράτηση ραντεβού
- Medical Assessment → Ιατρική αξιολόγηση

# **31. 🔴 COOKIE CONSENT — ACTUAL FUNCTIONALITY**

**Status: NEW**

### Requirement:
Non-essential cookies/trackers must NOT load before consent. No Analytics or Marketing cookie should be pre-enabled. The user must be able to choose “Only Necessary”, accept optional cookies, or manage categories separately. Changing consent later must actually stop the relevant technologies. The Active Cookie Inventory must always match what is actually installed in production (HDPA requirement).

# **32. 🔴 PRIVACY POLICY — TECHNICAL DETAILS**

**Status: NEW**

### Requirement:
Provide the final production list of: Hosting provider/location, Database provider/location, Email provider, SMS provider, Payment provider, Analytics tools, Cookie/SDK providers, Backups, Support tools, Any other third-party processor/subprocessor. Also identify whether any provider or technical access is located outside the EEA.

# **33. 🔴 CONSENT / TERMS LOGGING**

**Status: NEW**

### Requirement:
When a user accepts the Terms, marketing email/SMS consent, or cookie preferences, store: User ID, Consent type, Policy/version number, Date/time, Source of consent. If consent is withdrawn, store the withdrawal date/time as well.

# **34. 🔴 18+ AT REGISTRATION**

**Status: NEW**

### Requirement:
At registration, add a mandatory, unchecked checkbox: “I confirm that I am at least 18 years old and accept the Terms of Use.” The Privacy Policy must be linked separately. Marketing consent must NOT be bundled into this checkbox. The platform is 18+ only for launch.

# **35. 🔴 SMS / PUSH PRIVACY**

**Status: NEW**

### Requirement:
SMS, push notifications and email subject lines must not expose treatment names or sensitive medical information. Example: “BeautyDoctors Reminder: You have an appointment at 14:30. View the details in your account.” Do not send: “Reminder: Botox appointment tomorrow.”

# **36. 🟡 PROVIDER TERMS — RANKING / SUSPENSION / DATA**

**Status: NEW**

### Requirement:
Create a separate “Provider Terms / Terms for Clinics” page placeholder. Final legal copy will be supplied after lawyer confirms P2B Regulation details (ranking criteria, paid placement, data access, suspension reasons).

# **37. 🟡 REPORT CONTENT / REVIEW**

**Status: NEW**

### Requirement:
Add “Report” to each public review/user-generated content item. The Report function allows flagging content (Illegal, Abusive, False, Privacy-sensitive) which sends to an admin moderation queue. A simple workflow is sufficient for launch.

# **38. 🟡 ONLINE WITHDRAWAL — GIFT CARDS**

**Status: NEW**

### Requirement:
Ask the lawyer: For online Gift Cards and any other BeautyDoctors transaction where a right of withdrawal applies, is the website required to provide a separate electronic “Withdrawal from the Contract” functionality? No code implementation yet until confirmed.
