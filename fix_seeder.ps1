$path = "e:\ebizz\medical-aesthetics-backend\src\modules\crm\crm.controller.ts"
$content = Get-Content $path -Raw

$badCode = @"
  @Get('manager-crm/seed-mock-data')
  @ApiOperation({ summary: 'Seed mock CRM data for testing' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  seedMockData() {
    return this.crmService.seedMockCrmData();
  }
"@

$goodCode = @"
  @Get('manager-crm/seed-mock-data')
  @Public()
  @ApiOperation({ summary: 'Seed mock CRM data for testing' })
  seedMockData() {
    return this.crmService.seedMockCrmData();
  }
"@

if ($content.Contains($badCode)) {
    $content = $content.Replace($badCode, $goodCode)
    Set-Content $path -Value $content -NoNewline -Encoding UTF8
    Write-Host "Replaced successfully"
} else {
    Write-Host "Not found"
}
