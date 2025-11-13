import { useState, useEffect } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import './Home.css';
// import { generateAndSharePDF } from '../utils/pdfGenerator';

// Injetadas pelo Vite (vite.config.ts -> define)
declare const __GIT_COMMIT__: string;
declare const __BUILD_DATE__: string;

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
    'TELA PV ATC 1045',
    'TELA PV ATC 1050',
    'TELA PV ATC 1065',
    'TELA PV ATC 1065 AUTOLIMPANTE VENO',
    'TELA PV ATC 1065 AUTOLIMPANTE SERPA',
    'TELA PV ATC 1065 HARPA III',
    'TELA PV GALVANIZADO',
    'TELA PV INOX AISI 304',
    'TELA PV INOX AISI 316',
  ];

  const BUILD_HASH = __GIT_COMMIT__ || 'dev';
  const INSTALL_KEY = `telaco_calc_installed_${BUILD_HASH}`;

  // Entradas
  const [tipoProduto, setTipoProduto] = useState('');
  const [acabamentoTipo, setAcabamentoTipo] = useState('');
  const [malha, setMalha] = useState('');
  const [fio, setFio] = useState('');
  const [comp, setComp] = useState('');
  const [perda, setPerda] = useState('');
  const [larg, setLarg] = useState('');
  const [gancho, setGancho] = useState('');
  const [precoKg, setPrecoKg] = useState('');
  const [qtd, setQtd] = useState('');
  const [showConstantes, setShowConstantes] = useState(false);

  // PWA
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Resultados
  const [pesoFio, setPesoFio] = useState<number | null>(null);
  const [pesoM2, setPesoM2] = useState<number | null>(null);
  const [areaTotal, setAreaTotal] = useState<number | null>(null);
  const [pesoTotal, setPesoTotal] = useState<number | null>(null);
  const [precoM2, setPrecoM2] = useState<number | null>(null);
  const [precoTotal, setPrecoTotal] = useState<number | null>(null);

  // Constantes de cálculo
  const massa = 6.165;
  const c1 = 1.1;
  const c2 = 2;
  const c3 = 1000;

  // Converte string em número (vírgula -> ponto)
  const val = (value: string): number => {
    const v = (value ?? '').toString().replace(',', '.');
    const num = parseFloat(v);
    return isNaN(num) ? 0 : num;
  };

  // Validação de obrigatórios
  const validateInputs = (): boolean => {
    if (!tipoProduto) return false;
    const requiredFields = [malha, fio, comp, perda, larg];
    return requiredFields.every((field) => val(field) > 0);
  };

  // Formatadores
  const formatNumber = (num: number, decimals: number = 3): string =>
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);

  const formatCurrency = (num: number): string =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);

  // Cálculo principal
  const calc = () => {
    if (!validateInputs()) {
      alert(
        'Por favor, selecione um Tipo de Produto e preencha os campos obrigatórios (Malha, Fio, Comprimento, Perda, Largura) com valores maiores que zero.'
      );
      return;
    }

    const malhaNum = val(malha);
    const fioNum = val(fio);
    const compNum = val(comp);
    const perdaNum = val(perda);
    const largNum = val(larg);
    const ganhoNum = val(gancho);
    const precoKgNum = val(precoKg);
    const qtdNum = Math.max(1, val(qtd)) || 1;

    // 1) Peso do Fio (kg/m)
    const pesoFioCalc = ((fioNum * fioNum) * massa) / c3;

    // 2) Peso da Tela (kg/m²)
    const pesoM2Calc = (c3 / (fioNum + malhaNum)) * c2 * c1 * pesoFioCalc;

    // 3) Área (m²)
    const areaTotalCalc = Math.max(
      0,
      ((largNum + ganhoNum) / c3) * ((compNum + perdaNum) / c3)
    );

    // 4) Peso Total (kg)
    const pesoTotalCalc = pesoM2Calc * areaTotalCalc * qtdNum;

    // 5) Preço m² (R$)
    const precoM2Calc = pesoM2Calc * precoKgNum;

    // 6) Preço Total (R$)
    const precoTotalCalc = pesoTotalCalc * precoKgNum;

    setPesoFio(pesoFioCalc);
    setPesoM2(pesoM2Calc);
    setAreaTotal(areaTotalCalc);
    setPesoTotal(pesoTotalCalc);
    setPrecoM2(precoM2Calc);
    setPrecoTotal(precoTotalCalc);
  };

  // Limpar tudo
  const reset = () => {
    setTipoProduto('');
    setAcabamentoTipo('');
    setMalha('');
    setFio('');
    setComp('');
    setPerda('');
    setLarg('');
    setGancho('');
    setPrecoKg('');
    setQtd('');
    setPesoFio(null);
    setPesoM2(null);
    setAreaTotal(null);
    setPesoTotal(null);
    setPrecoM2(null);
    setPrecoTotal(null);
  };

  // Imprimir PDF
  const handlePrint = () => {
    window.print();
  };

  // Compartilhar via WhatsApp
  const handleShareWhatsApp = async () => {
    if (
      pesoFio === null ||
      pesoM2 === null ||
      areaTotal === null ||
      pesoTotal === null ||
      precoM2 === null ||
      precoTotal === null
    ) {
      alert('Por favor, calcule os valores primeiro antes de compartilhar.');
      return;
    }

    const malhaFormatada = parseFloat(malha).toFixed(2).replace('.', ',');
    const fioFormatado = parseFloat(fio).toFixed(2).replace('.', ',');
    const compFormatado = parseInt(comp);
    const largFormatado = parseInt(larg);
    const pesoTotalFormatado = formatNumber(pesoTotal, 2);

    let mensagem = `${tipoProduto} - AB ${malhaFormatada} MM - FIO ${fioFormatado} MM - ${compFormatado} X ${largFormatado} MM`;

    if (acabamentoTipo.trim() !== '') {
      mensagem += ` - ${acabamentoTipo.trim()}`;
    }

    mensagem += `\n\nPeso Bruto: ${pesoTotalFormatado} Kg`;

    const encodedMessage = encodeURIComponent(mensagem);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Detecta se está rodando em modo standalone (PWA)
  const isStandaloneMode = () => {
    const mql = window.matchMedia?.('(display-mode: standalone)');
    const isStandaloneMedia = mql ? mql.matches : false;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    return isStandaloneMedia || isIOSStandalone;
  };

  // Marca como instalado se já estiver em modo standalone (mas não mostra botão)
  useEffect(() => {
    try {
      if (isStandaloneMode()) {
        localStorage.setItem(INSTALL_KEY, '1');
        setShowInstallButton(false);
      }
    } catch (err) {
      console.error('Erro ao checar modo standalone:', err);
      setShowInstallButton(false);
    }
  }, [INSTALL_KEY]);

  // PWA: captura beforeinstallprompt + appinstalled
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      try {
        const alreadyInstalled = localStorage.getItem(INSTALL_KEY) === '1';
        // Só mostra o botão se:
        // - ainda não marcamos como instalado para essa build
        // - não está em modo standalone
        if (!alreadyInstalled && !isStandaloneMode()) {
          setShowInstallButton(true);
        }
      } catch {
        // se der erro de localStorage, ainda dá pra mostrar o botão
        if (!isStandaloneMode()) {
          setShowInstallButton(true);
        }
      }
    };

    const handleAppInstalled = () => {
      try {
        localStorage.setItem(INSTALL_KEY, '1');
      } catch {
        // ignora
      }
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [INSTALL_KEY]);

  // Handler do botão "Instalar App"
  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      try {
        localStorage.setItem(INSTALL_KEY, '1');
      } catch {
        // ignora
      }
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  // 🔄 Auto-update total quando a build mudar (web + PWA)
  useEffect(() => {
    const currentBuild = BUILD_HASH;
    const STORAGE_KEY = 'telaco_calc_build_hash';

    try {
      const savedBuild = localStorage.getItem(STORAGE_KEY);

      if (savedBuild && savedBuild !== currentBuild) {
        localStorage.setItem(STORAGE_KEY, currentBuild);

        if ('caches' in window) {
          caches
            .keys()
            .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .finally(() => {
              window.location.reload();
            });
        } else {
          window.location.reload();
        }
      } else if (!savedBuild && currentBuild) {
        localStorage.setItem(STORAGE_KEY, currentBuild);
      }
    } catch (err) {
      console.error('Falha ao verificar/atualizar build:', err);
    }
  }, [BUILD_HASH]);

  return (
    <div className="calculator-container">
      <div className="wrap">
        <header>
          <div className="brand">
            <img
              src="https://i.postimg.cc/gctNgQm4/logo-Telaco-Laranja-horizontal.png"
              alt="Telaço"
            />
            <div>
              <h1>Calculadora de Peso de Tela</h1>
              <div className="hint">
                Tela para peneiramento industrial — modelo de cálculo com
                constantes configuráveis
              </div>
            </div>
          </div>

          <div className="header-actions">
            {showInstallButton && (
              <button
                className="btn primary no-print"
                onClick={handleInstallApp}
                style={{ marginRight: '8px' }}
              >
                Instalar App
              </button>
            )}
            <button
              className="btn ghost no-print"
              onClick={handleShareWhatsApp}
              style={{ marginRight: '8px' }}
            >
              Compartilhar WhatsApp
            </button>
            <button className="btn ghost no-print" onClick={handlePrint}>
              Imprimir PDF
            </button>
            <span
              className="badge no-print"
              title={`Build: ${BUILD_HASH} — ${new Date(
                __BUILD_DATE__
              ).toLocaleString('pt-BR')}`}
            >
              {BUILD_HASH}
            </span>
          </div>
        </header>

        <section className="grid">
          {/* CARD ENTRADAS */}
          <div className="card" style={{ gridColumn: 'span 12' }}>
            <div className="hd">
              <h3>Entradas</h3>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={showConstantes}
                  onChange={(e) => setShowConstantes(e.target.checked)}
                />{' '}
                Exibir Constantes
              </label>
            </div>

            <div className="bd">
              <div className="inputs">
                {/* Linha exclusiva – Tipo de Produto */}
                <div className="control" style={{ gridColumn: 'span 8' }}>
                  <label>Tipo de Produto *</label>
                  <Select value={tipoProduto} onValueChange={setTipoProduto}>
                    <SelectTrigger
                      className="w-full"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        backgroundColor: '#1a1a1a',
                        color: '#fff',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      <SelectValue placeholder="-- Selecione um tipo de produto --" />
                    </SelectTrigger>

                    <SelectContent
                      position="popper"
                      sideOffset={6}
                      style={{
                        backgroundColor: '#1a1a1a',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: 12,
                        boxShadow: 'var(--shadow)',
                        padding: '6px 0',
                        overflow: 'hidden',
                        zIndex: 9999,
                      }}
                    >
                      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                        {PRODUCT_TYPES.map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                            // @ts-ignore
                            className="radix-select-item"
                            style={{
                              padding: '10px 12px',
                              background: 'transparent',
                              color: '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Linha exclusiva – Acabamento/Tipo */}
                <div className="control" style={{ gridColumn: 'span 8' }}>
                  <label>Acabamento/Tipo (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: SEM GANCHO - OND VB"
                    value={acabamentoTipo}
                    onChange={(e) =>
                      setAcabamentoTipo(e.target.value.toUpperCase())
                    }
                    style={{
                      textTransform: 'uppercase',
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #333',
                      backgroundColor: '#1a1a1a',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* Demais campos */}
                <div className="control">
                  <label>Malha (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex.: 19,05"
                    value={malha}
                    onChange={(e) => setMalha(e.target.value)}
                  />
                </div>

                <div className="control">
                  <label>Fio (mm)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex.: 9"
                    value={fio}
                    onChange={(e) => setFio(e.target.value)}
                  />
                </div>

                <div className="control">
                  <label>Comprimento (mm)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="ex.: 2500"
                    value={comp}
                    onChange={(e) => setComp(e.target.value)}
                  />
                </div>

                <div className="control">
                  <label>Perda (mm)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="ex.: 100"
                    value={perda}
                    onChange={(e) => setPerda(e.target.value)}
                  />
                </div>

                <div className="control">
                  <label>Largura (mm)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="ex.: 1980"
                    value={larg}
                    onChange={(e) => setLarg(e.target.value)}
                  />
                </div>

                <div className="control">
                  <label>Gancho (mm)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="ex.: 80"
                    value={gancho}
                    onChange={(e) => setGancho(e.target.value)}
                  />
                </div>

                {/* Parâmetros bloqueados */}
                {showConstantes && (
                  <div className="constantes-container">
                    <div className="control">
                      <label>Massa do material (g/cm³)</label>
                      <select disabled>
                        <option value="6.165">6,165 g/cm³</option>
                      </select>
                    </div>
                    <div className="control">
                      <label>Constante 1</label>
                      <select disabled>
                        <option value="1.1">1,10</option>
                      </select>
                    </div>
                    <div className="control">
                      <label>Constante 2</label>
                      <select disabled>
                        <option value="2">2</option>
                      </select>
                    </div>
                    <div className="control">
                      <label>Constante 3</label>
                      <select disabled>
                        <option value="1000">1000</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="control">
                  <label>Preço do Kg (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="ex.: 12,50"
                    value={precoKg}
                    onChange={(e) => setPrecoKg(e.target.value)}
                  />
                </div>

                <div className="control">
                  <label>Quantidade</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="1"
                    value={qtd}
                    onChange={(e) => setQtd(e.target.value)}
                  />
                </div>
              </div>

              <div className="actions">
                <button className="btn primary no-print" onClick={calc}>
                  Calcular
                </button>
                <button className="btn ghost no-print" onClick={reset}>
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* CARD RESULTADOS */}
          <div className="card" style={{ gridColumn: 'span 12' }}>
            <div className="hd">
              <h3>Resultados</h3>
            </div>
            <div className="bd">
              <div className="results">
                <div className="kpi">
                  <h4>Peso do Fio (kg/m)</h4>
                  <div className="val">
                    {pesoFio !== null ? formatNumber(pesoFio) : '—'}
                  </div>
                </div>
                <div className="kpi">
                  <h4>Peso da Tela (kg/m²)</h4>
                  <div className="val">
                    {pesoM2 !== null ? formatNumber(pesoM2) : '—'}
                  </div>
                </div>
                <div className="kpi">
                  <h4>Área total (m²)</h4>
                  <div className="val">
                    {areaTotal !== null ? formatNumber(areaTotal) : '—'}
                  </div>
                  <div className="sub" />
                </div>
              </div>

              <div className="results" style={{ marginTop: '12px' }}>
                <div className="kpi">
                  <h4>Peso Total (kg)</h4>
                  <div className="val">
                    {pesoTotal !== null ? formatNumber(pesoTotal) : '—'}
                  </div>
                </div>
                <div className="kpi">
                  <h4>Preço m² (R$)</h4>
                  <div className="val">
                    {precoM2 !== null ? formatCurrency(precoM2) : '—'}
                  </div>
                </div>
                <div className="kpi">
                  <h4>Preço Total (R$)</h4>
                  <div className="val">
                    {precoTotal !== null ? formatCurrency(precoTotal) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer>
          <div>© Telaço – Ferramenta interna.</div>
          <div />
        </footer>
      </div>
    </div>
  );
}






