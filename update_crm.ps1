$servicePath = "e:\ebizz\medical-aesthetics-backend\src\modules\crm\crm.service.ts"
$controllerPath = "e:\ebizz\medical-aesthetics-backend\src\modules\crm\crm.controller.ts"

# Update Service
$serviceContent = Get-Content $servicePath -Raw
$serviceContent = $serviceContent.TrimEnd()
if ($serviceContent.EndsWith("}")) {
    $serviceContent = $serviceContent.Substring(0, $serviceContent.Length - 1)
}
$serviceContent += @"

  async getGlobalCallLogs(dateRange?: { startDate: Date; endDate: Date }): Promise<any> {
    const qb = this.communicationLogsRepository.createQueryBuilder("log")
      .leftJoinAndSelect("log.salesperson", "salesperson")
      .leftJoinAndSelect("log.customer", "customer")
      .leftJoinAndSelect("log.relatedLead", "lead")
      .where("log.type = 'call'")
      .orderBy("log.createdAt", "DESC")
      .limit(100);

    if (dateRange) {
      qb.andWhere("log.createdAt BETWEEN :startDate AND :endDate", dateRange);
    }

    const logs = await qb.getMany();

    return logs.map(log => {
      const agentName = log.salesperson ? \`\${log.salesperson.firstName} \${log.salesperson.lastName}\` : "System";
      const custName = log.customer ? \`\${log.customer.firstName} \${log.customer.lastName}\` : (log.relatedLead ? \`\${log.relatedLead.firstName} \${log.relatedLead.lastName}\` : "Unknown");
      const phone = log.customer?.phone || log.relatedLead?.phone || (log.metadata as any)?.phone || "N/A";

      return {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        agentName: agentName,
        customerName: custName,
        customerPhone: phone,
        outcome: log.status === "completed" ? "answered" : "no_answer",
        durationSec: log.durationSeconds || 0
      };
    });
  }
}
"@
Set-Content -Path $servicePath -Value $serviceContent -NoNewline -Encoding UTF8

# Update Controller
$controllerContent = Get-Content $controllerPath -Raw
$controllerContent = $controllerContent.TrimEnd()
if ($controllerContent.EndsWith("}")) {
    $controllerContent = $controllerContent.Substring(0, $controllerContent.Length - 1)
}
$controllerContent += @"

  @Get('manager-crm/calls')
  @ApiOperation({ summary: 'Get global call logs for manager view' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER)
  @UseGuards(RolesGuard)
  getGlobalCallLogs(@Query() query: { startDate?: string; endDate?: string }) {
    const dateRange = query.startDate && query.endDate
      ? { startDate: new Date(query.startDate), endDate: new Date(query.endDate) }
      : undefined;
    return this.crmService.getGlobalCallLogs(dateRange);
  }
}
"@
Set-Content -Path $controllerPath -Value $controllerContent -NoNewline -Encoding UTF8
