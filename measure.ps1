Add-Type -AssemblyName System.Drawing

function Measure-Sprites($label, $base, $files) {
    Write-Host ""
    Write-Host "=== $label ===" -ForegroundColor Cyan
    foreach ($f in $files) {
        $path = Join-Path $base $f
        if (Test-Path $path) {
            $img = [System.Drawing.Image]::FromFile($path)
            $fw = 128
            # Tenta inferir frame height: se altura < 128, usa altura
            $fh = if ($img.Height -lt 128) { $img.Height } else { 128 }
            $frames = [int]($img.Width / $fw)
            Write-Host ("  {0,-25} {1,4}x{2,-4}  frameW:{3}  frameH:{4}  frames:{5}" -f $f, $img.Width, $img.Height, $fw, $fh, $frames)
            $img.Dispose()
        } else {
            Write-Host "  $f : NOT FOUND" -ForegroundColor Red
        }
    }
}

$fw_base = 'C:\Users\Blender_STG\Videos\Captures\AssetsGames\Player\Fire Wizard\'
$lm_base = 'C:\Users\Blender_STG\Videos\Captures\AssetsGames\Player\Lightning Mage\'
$wm_base = 'C:\Users\Blender_STG\Videos\Captures\AssetsGames\Player\Wanderer Magican\'

Measure-Sprites "FIRE WIZARD" $fw_base @(
    'Idle.png','Run.png','Walk.png','Jump.png',
    'Attack_1.png','Attack_2.png',
    'Charge.png','Flame_jet.png','Fireball.png',
    'Hurt.png','Dead.png'
)

Measure-Sprites "LIGHTNING MAGE" $lm_base @(
    'Idle.png','Run.png','Walk.png','Jump.png',
    'Attack_1.png','Attack_2.png',
    'Charge.png','Light_ball.png','Light_charge.png',
    'Hurt.png','Dead.png'
)

Measure-Sprites "WANDERER MAGICIAN" $wm_base @(
    'Idle.png','Run.png','Walk.png','Jump.png',
    'Attack_1.png','Attack_2.png',
    'Charge_1.png','Charge_2.png',
    'Magic_arrow.png','Magic_sphere.png',
    'Hurt.png','Dead.png'
)
