<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

function wayra_clean(?string $value): string {
    $value = trim((string) ($value ?? ''));
    return str_replace(["\r\n", "\r"], "\n", $value);
}

function wayra_pick(array $data, string $key): string {
    $value = $data[$key] ?? '';
    return is_string($value) ? wayra_clean($value) : '';
}

function wayra_radicado(string $prefix): string {
    return $prefix . '-' . date('Ymd-His') . '-' . random_int(1000, 9999);
}

function wayra_verify_recaptcha(string $token, string $expectedAction = ''): bool {
    $secret = getenv('RECAPTCHA_SECRET_KEY') ?: '';
    if ($secret === '') {
        return true;
    }

    if ($token === '') {
        return false;
    }

    $remoteIp = $_SERVER['REMOTE_ADDR'] ?? '';
    $postFields = http_build_query([
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $remoteIp,
    ]);

    $rawResponse = false;

    if (function_exists('curl_init')) {
        $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        $rawResponse = curl_exec($ch);
        curl_close($ch);
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-type: application/x-www-form-urlencoded\r\n",
                'content' => $postFields,
                'timeout' => 8,
            ],
        ]);
        $rawResponse = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $context);
    }

    if (!is_string($rawResponse) || $rawResponse === '') {
        return false;
    }

    $result = json_decode($rawResponse, true);
    if (!is_array($result) || empty($result['success'])) {
        return false;
    }

    $action = isset($result['action']) && is_string($result['action']) ? $result['action'] : '';
    $score = isset($result['score']) ? (float) $result['score'] : 0.0;
    $minScore = (float) (getenv('RECAPTCHA_MIN_SCORE') ?: '0.5');

    if ($expectedAction !== '' && $action !== $expectedAction) {
        return false;
    }

    if ($score < $minScore) {
        return false;
    }

    return true;
}

$raw = file_get_contents('php://input') ?: '';
$decoded = json_decode($raw, true);
$data = is_array($decoded) ? $decoded : $_POST;

$type = strtolower(wayra_pick($data, 'type'));
if ($type === '') {
    $type = strtolower(wayra_pick($data, 'form_type'));
}
$recaptchaToken = wayra_pick($data, 'recaptchaToken');

$recaptchaActionMap = [
    'contact' => 'contact_submit',
    'quote' => 'quote_submit',
    'pqrs' => 'pqrs_submit',
    'reserve' => 'reservation_submit',
];
$expectedAction = $recaptchaActionMap[$type] ?? 'submit';
if (!wayra_verify_recaptcha($recaptchaToken, $expectedAction)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'recaptcha_failed']);
    exit;
}

$to = 'reservas@vivewayra.com.co';
$from = 'reservas@vivewayra.com.co';
$siteName = 'WAYRA';
$subject = '';
$body = '';
$replyTo = '';
$radicado = '';

switch ($type) {
    case 'contact':
        $nombre = wayra_pick($data, 'nombre');
        $apellido = wayra_pick($data, 'apellido');
        $email = wayra_pick($data, 'email');
        $telefono = wayra_pick($data, 'telefono');
        $interes = wayra_pick($data, 'interes');
        $fechaIda = wayra_pick($data, 'fecha_ida');
        $fechaRegreso = wayra_pick($data, 'fecha_regreso');
        $mensaje = wayra_pick($data, 'mensaje');
        if ($nombre === '' || $email === '' || $mensaje === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'error' => 'missing_fields']);
            exit;
        }
        $radicado = wayra_radicado('WY-CON');
        $replyTo = $email;
        $subject = "[$radicado] Nuevo mensaje de contacto";
        $body = "Nuevo mensaje de contacto\n\n"
            . "Radicado: $radicado\n"
            . "Nombre: $nombre $apellido\n"
            . "Correo: $email\n"
            . "Telefono: $telefono\n"
            . "Interes: $interes\n\n"
            . "Fecha de ida: " . ($fechaIda !== '' ? $fechaIda : 'Por definir') . "\n"
            . "Fecha de regreso: " . ($fechaRegreso !== '' ? $fechaRegreso : 'Por definir') . "\n\n"
            . "Mensaje:\n$mensaje\n";
        break;

    case 'quote':
        $nombre = wayra_pick($data, 'nombre');
        $apellidos = wayra_pick($data, 'apellidos');
        $email = wayra_pick($data, 'email');
        $telefono = wayra_pick($data, 'telefono');
        $personas = wayra_pick($data, 'personas');
        $fechaIda = wayra_pick($data, 'fecha_ida');
        $fechaRegreso = wayra_pick($data, 'fecha_regreso');
        $fecha = wayra_pick($data, 'fecha');
        $plan = wayra_pick($data, 'plan');
        $comentarios = wayra_pick($data, 'comentarios');
        if ($nombre === '' || $apellidos === '' || $email === '' || $telefono === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'error' => 'missing_fields']);
            exit;
        }
        if ($fechaIda === '' && $fecha !== '') {
            $fechaIda = $fecha;
        }
        if ($fechaRegreso === '' && $fecha !== '') {
            $fechaRegreso = $fecha;
        }
        $radicado = wayra_radicado('WY-COT');
        $replyTo = $email;
        $subject = "[$radicado] Nueva cotizacion";
        $body = "Nueva cotizacion\n\n"
            . "Radicado: $radicado\n"
            . "Nombre: $nombre $apellidos\n"
            . "Correo: $email\n"
            . "Telefono: $telefono\n"
            . "Numero de personas: $personas\n"
            . "Fecha de ida: " . ($fechaIda !== '' ? $fechaIda : 'Por definir') . "\n"
            . "Fecha de regreso: " . ($fechaRegreso !== '' ? $fechaRegreso : 'Por definir') . "\n"
            . "Plan/Destino: $plan\n\n"
            . "Comentarios:\n$comentarios\n";
        break;

    case 'pqrs':
        $tipo = wayra_pick($data, 'tipo_pqrs');
        $nombres = wayra_pick($data, 'nombres');
        $apellidos = wayra_pick($data, 'apellidos');
        $tipoDoc = wayra_pick($data, 'tipo_documento');
        $numeroDoc = wayra_pick($data, 'numero_documento');
        $telefono = wayra_pick($data, 'telefono');
        $email = wayra_pick($data, 'email');
        $ciudad = wayra_pick($data, 'ciudad');
        $numeroReserva = wayra_pick($data, 'numero_reserva');
        $fechaServicio = wayra_pick($data, 'fecha_servicio');
        $servicio = wayra_pick($data, 'servicio_relacionado');
        $asunto = wayra_pick($data, 'asunto');
        $descripcion = wayra_pick($data, 'descripcion');
        $pretension = wayra_pick($data, 'pretension_o_solicitud');
        $canal = wayra_pick($data, 'canal_respuesta');
        if ($tipo === '' || $nombres === '' || $apellidos === '' || $email === '' || $telefono === '' || $descripcion === '' || $pretension === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'error' => 'missing_fields']);
            exit;
        }
        $radicado = wayra_radicado('WY-PQRS');
        $replyTo = $email;
        $subject = "[$radicado] PQRS $tipo";
        $body = "Nueva solicitud PQRS\n\n"
            . "Radicado: $radicado\n"
            . "Tipo: $tipo\n"
            . "Solicitante: $nombres $apellidos\n"
            . "Correo: $email\n"
            . "Telefono: $telefono\n"
            . "Ciudad: $ciudad\n"
            . "Documento: $tipoDoc $numeroDoc\n"
            . "Reserva/Contrato: $numeroReserva\n"
            . "Fecha del servicio: $fechaServicio\n"
            . "Servicio relacionado: $servicio\n"
            . "Asunto: $asunto\n"
            . "Canal de respuesta: $canal\n\n"
            . "Descripcion:\n$descripcion\n\n"
            . "Solucion esperada:\n$pretension\n";
        break;

    case 'reserve':
        $plan = wayra_pick($data, 'plan');
        $price = wayra_pick($data, 'price');
        $name = wayra_pick($data, 'name');
        $phone = wayra_pick($data, 'phone');
        $email = wayra_pick($data, 'email');
        $start = wayra_pick($data, 'start');
        $end = wayra_pick($data, 'end');
        $guests = wayra_pick($data, 'guests');
        $comments = wayra_pick($data, 'comments');
        if ($plan === '' || $name === '' || $phone === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'error' => 'missing_fields']);
            exit;
        }
        $radicado = wayra_radicado('WY-RES');
        $replyTo = $email;
        $subject = "[$radicado] Solicitud de reserva";
        $body = "Nueva solicitud de reserva\n\n"
            . "Radicado: $radicado\n"
            . "Plan: $plan\n"
            . "Precio estimado: $price\n"
            . "Nombre: $name\n"
            . "Telefono: $phone\n"
            . "Correo: $email\n"
            . "Fecha llegada: $start\n"
            . "Fecha salida: $end\n"
            . "Personas: $guests\n\n"
            . "Comentarios:\n$comments\n";
        break;

    default:
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'invalid_type']);
        exit;
}

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = "From: $siteName <$from>";
if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
    $headers[] = "Reply-To: $replyTo";
}

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$sent = mail($to, $encodedSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'mail_failed']);
    exit;
}

echo json_encode(['ok' => true, 'radicado' => $radicado]);
