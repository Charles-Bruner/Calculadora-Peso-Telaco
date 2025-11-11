import jsPDF from 'jspdf';

export interface CalculatorData {
  malha: string;
  fio: string;
  comp: string;
  perda: string;
  larg: string;
  gancho: string;
  precoKg: string;
  qtd: string;
  pesoFio: number;
  pesoM2: number;
  areaTotal: number;
  pesoTotal: number;
  precoM2: number;
  precoTotal: number;
  formatNumber: (num: number, decimals?: number) => string;
  formatCurrency: (num: number) => string;
}

export const generateAndSharePDF = async (data: CalculatorData) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let yPosition = margin;

    // Cor laranja da Telaco
    const orangeColor: [number, number, number] = [240, 100, 0];

    // Titulo
    doc.setFontSize(18);
    doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.text('Calculadora de Peso de Tela', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Telaço - Ferramenta de Cálculo Profissional', margin, yPosition);
    yPosition += 8;

    // Linha separadora
    doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // Secao de Entradas
    doc.setFontSize(12);
    doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.text('ENTRADAS', margin, yPosition);
    yPosition += 7;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const inputsData = [
      [`Malha (mm): ${data.malha}`, `Fio (mm): ${data.fio}`, `Comprimento (mm): ${data.comp}`],
      [`Perda (mm): ${data.perda}`, `Largura (mm): ${data.larg}`, `Gancho (mm): ${data.gancho}`],
      [`Preço do Kg (R$): ${data.precoKg}`, `Quantidade: ${data.qtd}`, '']
    ];

    inputsData.forEach(row => {
      row.forEach((text, index) => {
        if (text) {
          const xPos = margin + (index * (pageWidth - 2 * margin) / 3);
          doc.text(text, xPos, yPosition);
        }
      });
      yPosition += 5;
    });

    yPosition += 3;

    // Linha separadora
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    // Secao de Resultados
    doc.setFontSize(12);
    doc.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.text('RESULTADOS', margin, yPosition);
    yPosition += 7;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const resultsData = [
      [`Peso do Fio: ${data.formatNumber(data.pesoFio)} kg/m`, `Peso da Tela: ${data.formatNumber(data.pesoM2)} kg/m²`, `Área total: ${data.formatNumber(data.areaTotal)} m²`],
      [`Peso Total: ${data.formatNumber(data.pesoTotal)} kg`, `Preço m²: ${data.formatCurrency(data.precoM2)}`, `Preço Total: ${data.formatCurrency(data.precoTotal)}`]
    ];

    resultsData.forEach(row => {
      row.forEach((text, index) => {
        const xPos = margin + (index * (pageWidth - 2 * margin) / 3);
        doc.text(text, xPos, yPosition);
      });
      yPosition += 5;
    });

    yPosition += 5;

    // Rodape
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('© Telaço – Ferramenta interna', margin, pageHeight - 10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, pageHeight - 5);

    // Obter PDF como Blob
    const pdfBlob = doc.output('blob') as Blob;
    const fileName = `Calculadora_Telaco_${new Date().getTime()}.pdf`;

    // Criar FormData para upload
    const formData = new FormData();
    formData.append('file', pdfBlob, fileName);

    try {
      // Upload do PDF
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Erro ao fazer upload do PDF');
      }

      const uploadData = await uploadResponse.json();
      const pdfUrl = uploadData.url;

      // Salvar PDF localmente tambem
      doc.save(fileName);

      // Abrir WhatsApp Web com link do PDF
      const message = `Segue o cálculo de peso de tela gerado pela Calculadora Telaço:\n\n${pdfUrl}\n\nPeso Total: ${data.formatNumber(data.pesoTotal)} kg\nPreço Total: ${data.formatCurrency(data.precoTotal)}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    } catch (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      // Fallback: salvar localmente e abrir WhatsApp sem link
      doc.save(fileName);
      const message = `Segue o cálculo de peso de tela gerado pela Calculadora Telaço.\n\nPeso Total: ${data.formatNumber(data.pesoTotal)} kg\nPreço Total: ${data.formatCurrency(data.precoTotal)}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Por favor, tente novamente.');
  }
};
