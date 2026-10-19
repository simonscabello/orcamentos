<?php

namespace App\Http\Controllers;

use App\Models\Estimate;
use App\Support\EstimateSnapshot;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EstimatePdfController extends Controller
{
    public function __invoke(Request $request, int $estimate): Response
    {
        $estimate = Estimate::forBusiness($request->user()->business_id)
            ->with(['customer', 'vehicle', 'items', 'business'])->findOrFail($estimate);

        return $this->download($estimate);
    }

    /**
     * PDF de uma versão anterior, montado a partir da cópia guardada (cliente, veículo e itens da época).
     */
    public function version(Request $request, int $estimate, int $version): Response
    {
        $estimate = Estimate::forBusiness($request->user()->business_id)->with('business')->findOrFail($estimate);
        $snapshot = $estimate->versions()->where('version', $version)->firstOrFail()->snapshot;

        return $this->download(EstimateSnapshot::toEstimate($snapshot, $estimate->business));
    }

    private function download(Estimate $estimate): Response
    {
        $fileName = sprintf('orcamento-%03d', $estimate->number).($estimate->version > 1 ? "-v{$estimate->version}" : '').'.pdf';

        // Sem subsetting o DomPDF embute a DejaVu Sans inteira e o PDF passa de 800 KB,
        // pesado para mandar pelo WhatsApp. Com ele, só os glifos usados vão no arquivo.
        return Pdf::loadView('pdf.estimate', compact('estimate'))
            ->setOption('enable_font_subsetting', true)
            ->setPaper('a4')
            ->download($fileName);
    }
}
