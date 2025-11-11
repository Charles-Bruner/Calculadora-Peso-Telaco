import { useState, useEffect } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import './Home.css';
import { generateAndSharePDF } from '../utils/pdfGenerator';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Home() {
  // Tipos de produto
  const PRODUCT_TYPES = [
    'PENEIRA ATC 1045',
    'PENEIRA ATC 1050',
    'PENEIRA ATC 1065',
    'PENEIRA ATC 1065 AUTOLIMPANTE VENO',
    'PENEIRA ATC 1065 AUTOLIMPANTE SERPA',
    'PENEIRA ATC 1065 HARPA III',
    'PENEIRA GALVANIZADO',
    'PENEIRA INOX AISI 304',
    'PENEIRA INOX AISI 316',
    'PENEIRA INOX AISI 430',
    'PENEIRA INOX AISI 430 AUTOLIMPANTE VENO',
    'PENEIRA INOX AISI 430 AUTOLIMPANTE SERPA',
    'PENEIRA INOX AISI 430 HARPA III',
  ];

  // Estados para os campos de entrada
  const [produto, setProduto] = useState<string>('');
  const [malha, setMalha] = useState<string>('19.0');
  const [fio, setFio] = useState<string>('9');
  const [comprimento, setComprimento] = useState<string>('2500');
  const [perda, setPerda] = useState<string>('100');
  const [largura, setLargura] = useState<string>('1980');
  const [gancho, setGancho] = useState<string>('80');
  const [precoKg, setPrecoKg] = useState<string>('12.50');
  const [quantidade, setQuantidade] = useState<string>('1');
  const [acabamentoTipo, setAcabamentoTipo] = useState<string>(''); // Novo campo

  // Estados para os resultados
  const [pesoFio, setPesoFio] = useState<number | null>(null);
  const [pesoM2, setPesoM2] = useState<number | null>(null);
  const [areaTotal, setAreaTotal] = useState<number | null>(null);
  const [pesoTotal, setPesoTotal] = useState<number | null>(null);
  const [precoM2, setPrecoM2] = useState<number | null>(null);
  const [precoTotal, setPrecoTotal] = useState<number | null>(null);

  // Estado para o botão de instalação (PWA)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuário aceitou a instalação do PWA');
        } else {
          console.log('Usuário recusou a instalação do PWA');
        }
        setDeferredPrompt(null);
      });
    }
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return '—';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCurrency = (num: number | null) => {
    if (num === null) return '—';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const calcular = () => {
    const m = parseFloat(malha.replace(',', '.'));
    const f = parseFloat(fio.replace(',', '.'));
    const c = parseFloat(comprimento.replace(',', '.'));
    const p = parseFloat(perda.replace(',', '.'));
    const l = parseFloat(largura.replace(',', '.'));
    const g = parseFloat(gancho.replace(',', '.'));
    const pk = parseFloat(precoKg.replace(',', '.'));
    const q = parseFloat(quantidade.replace(',', '.'));

    if (isNaN(m) || isNaN(f) || isNaN(c) || isNaN(p) || isNaN(l) || isNaN(g) || isNaN(pk) || isNaN(q)) {
      alert('Por favor, preencha todos os campos obrigatórios com valores numéricos válidos.');
      return;
    }

    // Constantes (fixas)
    const densidadeAco = 7.85; // g/cm³
    const constanteFio = 0.006165; // Constante para cálculo de peso do fio (fórmula: D² * 0.006165)

    // 1. Peso do Fio (kg/m)
    const pesoFioCalc = constanteFio * (f * f);
    setPesoFio(pesoFioCalc);

    // 2. Peso da Tela (kg/m²)
    const pesoTelaM2 = (pesoFioCalc * 1000) / (m + f);
    setPesoM2(pesoTelaM2);

    // 3. Área Total (m²)
    const areaTotalCalc = ((c - p) / 1000) * ((l - g) / 1000) * q;
    setAreaTotal(areaTotalCalc);

    // 4. Peso Total (kg)
    const pesoTotalCalc = pesoTelaM2 * areaTotalCalc;
    setPesoTotal(pesoTotalCalc);

    // 5. Preço m² (R$)
    const precoM2Calc = pesoTelaM2 * pk;
    setPrecoM2(precoM2Calc);

    // 6. Preço Total (R$)
    const precoTotalCalc = pesoTotalCalc * pk;
    setPrecoTotal(precoTotalCalc);
  };

  const limpar = () => {
    setProduto('');
    setMalha('19.0');
    setFio('9');
    setComprimento('2500');
    setPerda('100');
    setLargura('1980');
    setGancho('80');
    setPrecoKg('12.50');
    setQuantidade('1');
    setAcabamentoTipo('');
    setPesoFio(null);
    setPesoM2(null);
    setAreaTotal(null);
    setPesoTotal(null);
    setPrecoM2(null);
    setPrecoTotal(null);
  };

  const handleShareWhatsApp = async () => {
    if (pesoTotal === null) {
      alert('Por favor, calcule o peso antes de compartilhar.');
      return;
    }

    // 1. Geração do PDF e Upload (Simulado)
    const pdfUrl = await generateAndSharePDF({
      produto,
      malha,
      fio,
      comprimento,
      perda,
      largura,
      gancho,
      precoKg,
      quantidade,
      acabamentoTipo,
      pesoFio,
      pesoM2,
      areaTotal,
      pesoTotal,
      precoM2,
      precoTotal,
    });

    // 2. Montagem da Mensagem
    const acabamento = acabamentoTipo ? ` - ${acabamentoTipo}` : '';
    const primeiraLinha = `${produto} - AB ${formatNumber(parseFloat(malha))} MM - FIO ${formatNumber(parseFloat(fio))} MM - ${comprimento} X ${largura} MM - ${gancho} MM${acabamento}`;
    const segundaLinha = `Peso Bruto: ${formatNumber(pesoTotal)} Kg`;

    const mensagem = `${primeiraLinha}\n${segundaLinha}\n\nConfira o orçamento completo: ${pdfUrl}`;

    // 3. Compartilhamento
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem )}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="calculator-container">
      <div className="wrap">
        <header>
          <div className="logo">
            <div className="hash">#</div>
            <div className="text">TELAÇO</div>
          </div>
          <div className="title">
            <h1>Calculadora de Peso de Tela</h1>
            <p>Tela para peneiramento industrial – modelo de cálculo com constantes configuráveis</p>
          </div>
          <div className="actions">
            {deferredPrompt && (
              <button className="btn-install" onClick={handleInstallClick}>
                Instalar App
              </button>
            )}
            <button className="btn-share" onClick={handleShareWhatsApp}>
              Compartilhar WhatsApp
            </button>
            <button className="btn-pdf" onClick={() => alert('Funcionalidade de PDF em desenvolvimento.')}>
              Imprimir PDF
            </button>
            <div className="version">v1.5.0 - Telaço</div>
          </div>
        </header>

        <section className="card">
          <div className="card-header">
            <h2>ENTRADAS</h2>
            <div className="toggle-constants">
              <input type="checkbox" id="exibir-constantes" />
              <label htmlFor="exibir-constantes">Exibir Constantes</label>
            </div>
          </div>
          <div className="card-body">
            <div className="select-control">
              <label htmlFor="produto">Tipo de Produto *</label>
              <Select value={produto} onValueChange={setProduto}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Selecione um tipo de produto --" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="inputs">
              <div className="control">
                <label htmlFor="malha">Malha (mm)</label>
                <input id="malha" type="text" value={malha} onChange={(e) => setMalha(e.target.value)} placeholder="ex: 19.0" />
              </div>
              <div className="control">
                <label htmlFor="fio">Fio (mm)</label>
                <input id="fio" type="text" value={fio} onChange={(e) => setFio(e.target.value)} placeholder="ex: 9" />
              </div>
              <div className="control">
                <label htmlFor="comprimento">Comprimento (mm)</label>
                <input id="comprimento" type="text" value={comprimento} onChange={(e) => setComprimento(e.target.value)} placeholder="ex: 2500" />
              </div>
              <div className="control">
                <label htmlFor="perda">Perda (mm)</label>
                <input id="perda" type="text" value={perda} onChange={(e) => setPerda(e.target.value)} placeholder="ex: 100" />
              </div>
              <div className="control">
                <label htmlFor="largura">Largura (mm)</label>
                <input id="largura" type="text" value={largura} onChange={(e) => setLargura(e.target.value)} placeholder="ex: 1980" />
              </div>
              <div className="control">
                <label htmlFor="gancho">Gancho (mm)</label>
                <input id="gancho" type="text" value={gancho} onChange={(e) => setGancho(e.target.value)} placeholder="ex: 80" />
              </div>
              <div className="control">
                <label htmlFor="precoKg">Preço do Kg (R$)</label>
                <input id="precoKg" type="text" value={precoKg} onChange={(e) => setPrecoKg(e.target.value)} placeholder="ex: 12.50" />
              </div>
              <div className="control">
                <label htmlFor="quantidade">Quantidade</label>
                <input id="quantidade" type="text" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="1" />
              </div>
              {/* Novo Campo Acabamento/Tipo */}
              <div className="control full-width">
                <label htmlFor="acabamentoTipo">Acabamento/Tipo (Opcional)</label>
                <input id="acabamentoTipo" type="text" value={acabamentoTipo} onChange={(e) => setAcabamentoTipo(e.target.value)} placeholder="ex: SEM GANCHO - OND VB" />
              </div>
            </div>

            <div className="actions">
              <button className="btn-calculate" onClick={calcular}>
                Calcular
              </button>
              <button className="btn-clear" onClick={limpar}>
                Limpar
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>RESULTADOS</h2>
          </div>
          <div className="card-body">
            <div className="results-grid">
              <div className="results">
                <div className="kpi">
                  <h4>Peso do Fio (kg/m)</h4>
                  <div className="val">{pesoFio !== null ? formatNumber(pesoFio) : '—'}</div>
                </div>
                <div className="kpi">
                  <h4>Peso da Tela (kg/m²)</h4>
                  <div className="val">{pesoM2 !== null ? formatNumber(pesoM2) : '—'}</div>
                </div>
                <div className="kpi">
                  <h4>Área total (m²)</h4>
                  <div className="val">{areaTotal !== null ? formatNumber(areaTotal) : '—'}</div>
                  <div className="sub"></div>
                </div>
              </div>
              <div className="results" style={{ marginTop: '12px' }}>
                <div className="kpi">
                  <h4>Peso Total (kg)</h4>
                  <div className="val">{pesoTotal !== null ? formatNumber(pesoTotal) : '—'}</div>
                </div>
                <div className="kpi">
                  <h4>Preço m² (R$)</h4>
                  <div className="val">{precoM2 !== null ? formatCurrency(precoM2) : '—'}</div>
                </div>
                <div className="kpi">
                  <h4>Preço Total (R$)</h4>
                  <div className="val">{precoTotal !== null ? formatCurrency(precoTotal) : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer>
          <div>© Telaço – Ferramenta interna.</div>
          <div></div>
        </footer>
      </div>
    </div>
  );
}


