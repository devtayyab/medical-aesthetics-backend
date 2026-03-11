$path = "e:\ebizz\medical-aesthetics-backend\src\modules\crm\crm.controller.ts"
$content = Get-Content $path -Raw

# 1. Fix createAction property
$badAction = @"
    return this.crmService.createAction({
      ...actionData,
      createdBy: req.user.id,
    });
"@
$goodAction = @"
    return this.crmService.createAction({
      ...actionData,
      salespersonId: actionData.salespersonId || req.user.id,
    });
"@
if ($content.Contains($badAction)) {
    $content = $content.Replace($badAction, $goodAction)
}

# 2. Add seedMockData endpoint before the final }
# Actually find the end of the class
$lastBraceIndex = $content.LastIndexOf("}")
if ($lastBraceIndex -gt -1) {
    # Check if seedMockData already exists
    if (-not $content.Contains("seedMockData()")) {
        $seederCode = @"
  @Get('manager-crm/seed-mock-data')
  @ApiOperation({ summary: 'Seed mock CRM data for testing' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  seedMockData() {
    return this.crmService.seedMockCrmData();
  }

"@
        $content = $content.Insert($lastBraceIndex, $seederCode)
    }
}

Set-Content $path -Value $content -NoNewline -Encoding UTF8
