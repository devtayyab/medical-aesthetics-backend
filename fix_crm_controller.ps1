$path = "e:\ebizz\medical-aesthetics-backend\src\modules\crm\crm.controller.ts"
$content = Get-Content $path -Raw
# Find the first occurrence of manager-crm/calls
$firstIndex = $content.IndexOf("@Get('manager-crm/calls')")
if ($firstIndex -gt -1) {
    # Find the second occurrence after the first
    $secondIndex = $content.IndexOf("@Get('manager-crm/calls')", $firstIndex + 1)
    if ($secondIndex -gt -1) {
        # Keep everything up to the second occurrence, but we need to find where the second method ends.
        # It ends at the last } before the final } of the class.
        # Actually, simpler: just remove the duplicate block.
        # The block starts at $secondIndex and goes until the next } (which is the method end) and one more } (class end).
        # Wait, the duplication I saw was:
        # 777:   @Get('manager-crm/calls')
        # ...
        # 786:   }
        # 787: 
        # 788:   @Get('manager-crm/calls')
        # ...
        # 797:   }
        # 798: }
        
        # I'll just trim the file after the first closing brace of that method.
        $afterFirst = $content.Substring($firstIndex)
        $firstMethodEnd = $afterFirst.IndexOf("}")
        # Find the second closing brace (end of method)
        $count = 0
        $pos = $firstIndex
        while ($pos -lt $content.Length) {
            if ($content[$pos] -eq '{') { $count++ }
            if ($content[$pos] -eq '}') { 
                $count--
                if ($count -eq 0) {
                    # This is the end of the method
                    $methodEndPos = $pos
                    break
                }
            }
            $pos++
        }
        
        if ($methodEndPos -gt 0) {
            $newContent = $content.Substring(0, $methodEndPos + 1) + "`n}"
            Set-Content $path -Value $newContent -NoNewline -Encoding UTF8
        }
    }
}
