<?php
/**
 * ical-proxy.php — Refúgio da Mata
 * Lê os calendários iCal do Airbnb e Booking.com
 * e retorna as datas ocupadas em JSON para o site.
 *
 * COMO USAR:
 * 1. Substitua as URLs abaixo pelos seus links iCal reais
 * 2. Faça upload deste arquivo na raiz do seu site na Hostinger
 * 3. Acesse: seusite.com.br/ical-proxy.php para testar
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=3600'); // cache de 1h

// ══════════════════════════════════════════
//  SUBSTITUA AQUI pelos seus links iCal reais
// ══════════════════════════════════════════
$calendarios = [
    'airbnb'  => 'https://www.airbnb.com.br/calendar/ical/SEU_ID.ics?s=SEU_TOKEN',
    'booking' => 'https://ical.booking.com/v1/export?t=SEU_TOKEN',
];

// ── Datas de demonstração (remova quando tiver os links reais) ──
$demo_ocupadas = gerarDatasDemo();

// ── Busca e processa os calendários ──
$datas_ocupadas = [];
$fontes_ativas  = [];
$erros          = [];

foreach ($calendarios as $fonte => $url) {
    // Pula URLs de demonstração
    if (strpos($url, 'SEU_') !== false) {
        continue;
    }

    $ical = buscarIcal($url);

    if ($ical === false) {
        $erros[] = "Não foi possível acessar o calendário: $fonte";
        continue;
    }

    $datas = parseIcal($ical);
    $datas_ocupadas = array_merge($datas_ocupadas, $datas);
    $fontes_ativas[] = $fonte;
}

// Remove duplicatas e ordena
$datas_ocupadas = array_values(array_unique($datas_ocupadas));
sort($datas_ocupadas);

// Se não há fontes reais, usa demo
$modo_demo = empty($fontes_ativas);
if ($modo_demo) {
    $datas_ocupadas = $demo_ocupadas;
}

echo json_encode([
    'sucesso'        => true,
    'demo'           => $modo_demo,
    'fontes'         => $fontes_ativas,
    'total_ocupadas' => count($datas_ocupadas),
    'datas_ocupadas' => $datas_ocupadas,
    'atualizado_em'  => date('Y-m-d H:i:s'),
    'erros'          => $erros,
]);


// ══════════════════════════════════════════
//  FUNÇÕES
// ══════════════════════════════════════════

/**
 * Busca o conteúdo de uma URL iCal
 */
function buscarIcal(string $url): string|false {
    $ctx = stream_context_create([
        'http' => [
            'timeout'    => 10,
            'user_agent' => 'Mozilla/5.0 (compatible; RefugioCalendar/1.0)',
        ],
        'ssl'  => [
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ],
    ]);

    $conteudo = @file_get_contents($url, false, $ctx);
    return $conteudo;
}

/**
 * Faz o parse de um arquivo iCal e extrai todas as datas ocupadas
 * Retorna array de strings no formato 'Y-m-d'
 */
function parseIcal(string $ical): array {
    $datas = [];
    $linhas = preg_split('/\r\n|\r|\n/', $ical);

    $em_evento  = false;
    $dt_start   = null;
    $dt_end     = null;
    $status     = '';

    foreach ($linhas as $linha) {
        $linha = trim($linha);

        if ($linha === 'BEGIN:VEVENT') {
            $em_evento = true;
            $dt_start  = null;
            $dt_end    = null;
            $status    = '';
            continue;
        }

        if ($linha === 'END:VEVENT') {
            $em_evento = false;

            // Ignora eventos cancelados
            if (strtoupper($status) === 'CANCELLED') {
                continue;
            }

            if ($dt_start && $dt_end) {
                $periodo = gerarPeriodo($dt_start, $dt_end);
                $datas   = array_merge($datas, $periodo);
            }
            continue;
        }

        if (!$em_evento) continue;

        // DTSTART
        if (preg_match('/^DTSTART(?:;[^:]+)?:(\d{8})/', $linha, $m)) {
            $dt_start = $m[1];
        }
        // DTEND
        if (preg_match('/^DTEND(?:;[^:]+)?:(\d{8})/', $linha, $m)) {
            $dt_end = $m[1];
        }
        // STATUS
        if (str_starts_with($linha, 'STATUS:')) {
            $status = substr($linha, 7);
        }
    }

    return $datas;
}

/**
 * Gera todas as datas de um período (check-in até check-out exclusive)
 * Formato de entrada: 'YYYYMMDD'
 * Formato de saída: ['Y-m-d', ...]
 */
function gerarPeriodo(string $inicio, string $fim): array {
    $datas = [];

    try {
        $dt_ini = new DateTime($inicio);
        $dt_fim = new DateTime($fim);
        $intervalo = new DateInterval('P1D');
        $periodo   = new DatePeriod($dt_ini, $intervalo, $dt_fim);

        foreach ($periodo as $data) {
            $datas[] = $data->format('Y-m-d');
        }
    } catch (Exception $e) {
        // ignora datas inválidas
    }

    return $datas;
}

/**
 * Gera datas de demonstração realistas para os próximos 3 meses
 */
function gerarDatasDemo(): array {
    $datas = [];
    $hoje  = new DateTime();

    $reservas_demo = [
        // Reserva 1 — semana que vem
        ['dias' => 8,  'duracao' => 3],
        // Reserva 2 — daqui a 2 semanas
        ['dias' => 16, 'duracao' => 2],
        // Reserva 3 — daqui a 3 semanas
        ['dias' => 22, 'duracao' => 4],
        // Reserva 4 — próximo mês
        ['dias' => 35, 'duracao' => 3],
        // Reserva 5 — próximo mês
        ['dias' => 45, 'duracao' => 5],
        // Reserva 6 — daqui a 2 meses
        ['dias' => 62, 'duracao' => 2],
        // Reserva 7 — daqui a 2 meses
        ['dias' => 75, 'duracao' => 3],
        // Reserva 8 — daqui a 3 meses
        ['dias' => 88, 'duracao' => 4],
    ];

    foreach ($reservas_demo as $reserva) {
        $inicio = (clone $hoje)->modify("+{$reserva['dias']} days");
        $fim    = (clone $inicio)->modify("+{$reserva['duracao']} days");

        $periodo = new DatePeriod(
            $inicio,
            new DateInterval('P1D'),
            $fim
        );

        foreach ($periodo as $data) {
            $datas[] = $data->format('Y-m-d');
        }
    }

    return array_unique($datas);
}
