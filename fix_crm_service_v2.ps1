$path = "e:\ebizz\medical-aesthetics-backend\src\modules\crm\crm.service.ts"
$content = [System.IO.File]::ReadAllText($path)

$find = "async seedMockCrmData"
$index = $content.IndexOf($find)

if ($index -ge 0) {
    $pre = $content.Substring(0, $index)
    $fixedCode = @'
async seedMockCrmData(): Promise<any> {
    const clinics = await this.clinicsRepository.find();
    const agents = await this.usersRepository.find({ where: { role: UserRole.SALESPERSON } });
    const servicesRepository = this.dataSource.getRepository(Service);
    const services = await servicesRepository.find();

    const results = {
      leads: 0,
      calls: 0,
      appointments: 0
    };

    if (agents.length > 0) {
      const leadNames = [['John', 'Doe'], ['Jane', 'Smith'], ['Michael', 'Brown'], ['Emily', 'Davis'], ['Robert', 'Wilson']];
      for (const [f, l] of leadNames) {
        const lead = this.leadsRepository.create({
          firstName: f,
          lastName: l,
          email: `${f.toLowerCase()}@test_${Date.now()}_${Math.floor(Math.random() * 1000)}.com`,
          phone: '+44' + Math.floor(Math.random() * 1000000000).toString(),
          status: LeadStatus.NEW,
          assignedSalesId: agents[Math.floor(Math.random() * agents.length)].id,
          source: 'facebook_ads',
          createdAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30)))
        });
        const savedLead = await this.leadsRepository.save(lead);
        results.leads++;

        for (let i = 0; i < 3; i++) {
          await this.communicationLogsRepository.save({
            relatedLeadId: savedLead.id,
            salespersonId: savedLead.assignedSalesId,
            type: 'call',
            status: Math.random() > 0.3 ? 'completed' : 'missed',
            notes: `Follow up call ${i + 1} for lead ${savedLead.firstName}`,
            durationSeconds: Math.floor(Math.random() * 300),
            createdAt: new Date(new Date().getTime() - Math.random() * 1000000)
          });
          results.calls++;
        }
      }

      if (services.length > 0 && clinics.length > 0) {
        for (let i = 0; i < 50; i++) {
          const clinic = clinics[Math.floor(Math.random() * clinics.length)];
          const agent = agents[Math.floor(Math.random() * agents.length)];
          const service = services[Math.floor(Math.random() * services.length)];

          const apt = this.appointmentsRepository.create({
            clinicId: clinic.id,
            serviceId: service.id,
            clientId: agents[0].id,
            bookedById: agent.id,
            startTime: new Date(new Date().getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
            endTime: new Date(),
            status: AppointmentStatus.COMPLETED,
            totalAmount: 150 + Math.random() * 500,
            amountPaid: 150 + Math.random() * 500,
            createdAt: new Date(),
          });
          await this.appointmentsRepository.save(apt);
          results.appointments++;
        }
      }
    }
    return { message: 'Mock data seeded successfully', ...results };
  }
}
'@
    [System.IO.File]::WriteAllText($path, ($pre + $fixedCode))
    Write-Host "Service fixed."
} else {
    Write-Host "Pattern not found."
}
