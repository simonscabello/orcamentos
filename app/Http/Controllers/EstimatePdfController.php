<?php

namespace App\Http\Controllers;

use App\Models\Estimate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EstimatePdfController extends Controller
{
    public function __invoke(Request $request, int $estimate): Response
    {
        $estimate = Estimate::forBusiness($request->user()->business_id)
            ->with(['customer', 'vehicle', 'items', 'business'])->findOrFail($estimate);

        // Sem subsetting o DomPDF embute a DejaVu Sans inteira e o PDF passa de 800 KB,
        // pesado para mandar pelo WhatsApp. Com ele, só os glifos usados vão no arquivo.
        return Pdf::loadView('pdf.estimate', compact('estimate'))
            ->setOption('enable_font_subsetting', true)
            ->setPaper('a4')
            ->download(sprintf('orcamento-%03d.pdf', $estimate->number));
    }
}
