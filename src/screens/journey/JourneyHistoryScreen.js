import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import { supabase } from '../../services/supabase';

const FILTROS = [
  {
    label: 'Hoje',
    value: 'hoje',
  },
  {
    label: 'Semana',
    value: 'semana',
  },
  {
    label: 'Mês',
    value: 'mes',
  },
  {
    label: 'Todos',
    value: 'todos',
  },
  {
    label: 'Período',
    value: 'periodo',
  },
];

export default function JourneyHistoryScreen({
  navigation,
}) {
  const [jornadas, setJornadas] =
    useState([]);

  const [veiculos, setVeiculos] =
    useState({});

  const [filtro, setFiltro] =
    useState('mes');

  const [dataInicial, setDataInicial] =
    useState('');

  const [dataFinal, setDataFinal] =
    useState('');

  const [
    periodoAplicado,
    setPeriodoAplicado,
  ] = useState(null);

  const [carregando, setCarregando] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      carregarHistorico();
    }, [])
  );

  async function carregarHistorico() {
    try {
      setCarregando(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          'Sessão inválida',
          'Faça login novamente.'
        );

        navigation.replace('Login');

        return;
      }

      const {
        data: dadosJornadas,
        error: erroJornadas,
      } = await supabase
        .from('jornadas')
        .select(`
          id,
          veiculo_id,
          inicio,
          fim,
          km_inicial,
          km_final,
          quantidade_corridas,
          valor_recebido,
          observacao,
          status
        `)
        .eq(
          'usuario_id',
          user.id
        )
        .eq(
          'status',
          'finalizada'
        )
        .order('inicio', {
          ascending: false,
        });

      if (erroJornadas) {
        console.log(
          'Erro ao carregar histórico:',
          erroJornadas
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar o histórico.'
        );

        return;
      }

      setJornadas(
        dadosJornadas || []
      );

      const idsVeiculos = [
        ...new Set(
          (dadosJornadas || [])
            .map(
              (jornada) =>
                jornada.veiculo_id
            )
            .filter(Boolean)
        ),
      ];

      if (
        idsVeiculos.length === 0
      ) {
        setVeiculos({});
        return;
      }

      const {
        data: dadosVeiculos,
        error: erroVeiculos,
      } = await supabase
        .from('veiculos')
        .select(
          'id, marca, modelo, placa'
        )
        .in(
          'id',
          idsVeiculos
        );

      if (erroVeiculos) {
        console.log(
          'Erro ao carregar veículos:',
          erroVeiculos
        );

        return;
      }

      const mapaVeiculos = {};

      (dadosVeiculos || []).forEach(
        (veiculo) => {
          mapaVeiculos[veiculo.id] =
            veiculo;
        }
      );

      setVeiculos(
        mapaVeiculos
      );
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao consultar o histórico.'
      );
    } finally {
      setCarregando(false);
    }
  }

  function inicioDoDia(data) {
    const novaData =
      new Date(data);

    novaData.setHours(
      0,
      0,
      0,
      0
    );

    return novaData;
  }

  function fimDoDia(data) {
    const novaData =
      new Date(data);

    novaData.setHours(
      23,
      59,
      59,
      999
    );

    return novaData;
  }

  function inicioDaSemana(data) {
    const novaData =
      inicioDoDia(data);

    const dia =
      novaData.getDay();

    const diferenca =
      dia === 0
        ? -6
        : 1 - dia;

    novaData.setDate(
      novaData.getDate() +
        diferenca
    );

    return novaData;
  }

  function inicioDoMes(data) {
    return new Date(
      data.getFullYear(),
      data.getMonth(),
      1
    );
  }

  /*
   * Aplica automaticamente a máscara
   * DD/MM/AAAA enquanto o usuário digita.
   *
   * Exemplo:
   * 07092026 -> 07/09/2026
   */
  function formatarEntradaData(texto) {
    const numeros = texto
      .replace(/\D/g, '')
      .slice(0, 8);

    if (numeros.length <= 2) {
      return numeros;
    }

    if (numeros.length <= 4) {
      return `${numeros.slice(
        0,
        2
      )}/${numeros.slice(2)}`;
    }

    return `${numeros.slice(
      0,
      2
    )}/${numeros.slice(
      2,
      4
    )}/${numeros.slice(4)}`;
  }

  /*
   * Converte DD/MM/AAAA para Date
   * e também valida se a data
   * realmente existe.
   */
  function converterData(texto) {
    const formatoValido =
      /^\d{2}\/\d{2}\/\d{4}$/;

    if (
      !formatoValido.test(texto)
    ) {
      return null;
    }

    const partes =
      texto.split('/');

    const dia =
      Number(partes[0]);

    const mes =
      Number(partes[1]);

    const ano =
      Number(partes[2]);

    const data =
      new Date(
        ano,
        mes - 1,
        dia
      );

    /*
     * Evita datas inexistentes,
     * como:
     *
     * 31/02/2026
     * 32/01/2026
     * 00/09/2026
     */
    if (
      data.getFullYear() !==
        ano ||
      data.getMonth() !==
        mes - 1 ||
      data.getDate() !==
        dia
    ) {
      return null;
    }

    return data;
  }

  function aplicarPeriodo() {
    /*
     * Campos obrigatórios
     */
    if (
      !dataInicial.trim() ||
      !dataFinal.trim()
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Informe a data inicial e a data final no formato DD/MM/AAAA.'
      );

      return;
    }

    /*
     * Formato obrigatório:
     * DD/MM/AAAA
     */
    const formatoValido =
      /^\d{2}\/\d{2}\/\d{4}$/;

    if (
      !formatoValido.test(
        dataInicial
      ) ||
      !formatoValido.test(
        dataFinal
      )
    ) {
      Alert.alert(
        'Formato inválido',
        'As datas devem ser informadas no formato DD/MM/AAAA.'
      );

      return;
    }

    const inicio =
      converterData(
        dataInicial
      );

    const fim =
      converterData(
        dataFinal
      );

    /*
     * Verifica se a data inicial
     * realmente existe.
     */
    if (!inicio) {
      Alert.alert(
        'Data inicial inválida',
        'Informe uma data inicial existente no formato DD/MM/AAAA.'
      );

      return;
    }

    /*
     * Verifica se a data final
     * realmente existe.
     */
    if (!fim) {
      Alert.alert(
        'Data final inválida',
        'Informe uma data final existente no formato DD/MM/AAAA.'
      );

      return;
    }

    /*
     * Obtém a data atual zerando
     * horas, minutos e segundos.
     */
    const hoje =
      inicioDoDia(
        new Date()
      );

    /*
     * Não permite data inicial
     * no futuro.
     */
    if (inicio > hoje) {
      Alert.alert(
        'Data futura',
        'A data inicial não pode ser posterior à data de hoje.'
      );

      return;
    }

    /*
     * Não permite data final
     * no futuro.
     */
    if (fim > hoje) {
      Alert.alert(
        'Data futura',
        'A data final não pode ser posterior à data de hoje.'
      );

      return;
    }

    /*
     * Data final não pode ser
     * anterior à inicial.
     */
    if (fim < inicio) {
      Alert.alert(
        'Período inválido',
        'A data final não pode ser anterior à data inicial.'
      );

      return;
    }

    setPeriodoAplicado({
      inicio:
        inicioDoDia(inicio),

      fim:
        fimDoDia(fim),
    });
  }

  function limparPeriodo() {
    setDataInicial('');
    setDataFinal('');
    setPeriodoAplicado(
      null
    );
  }

  const jornadasFiltradas =
    useMemo(() => {
      const agora =
        new Date();

      /*
       * Todas as jornadas
       */
      if (filtro === 'todos') {
        return jornadas;
      }

      /*
       * Período personalizado
       */
      if (
        filtro === 'periodo'
      ) {
        if (!periodoAplicado) {
          return jornadas;
        }

        return jornadas.filter(
          (jornada) => {
            const dataJornada =
              new Date(
                jornada.inicio
              );

            return (
              dataJornada >=
                periodoAplicado.inicio &&
              dataJornada <=
                periodoAplicado.fim
            );
          }
        );
      }

      let inicioPeriodo;

      /*
       * Hoje
       */
      if (filtro === 'hoje') {
        inicioPeriodo =
          inicioDoDia(agora);
      }

      /*
       * Semana atual
       */
      if (
        filtro === 'semana'
      ) {
        inicioPeriodo =
          inicioDaSemana(agora);
      }

      /*
       * Mês atual
       */
      if (filtro === 'mes') {
        inicioPeriodo =
          inicioDoMes(agora);
      }

      return jornadas.filter(
        (jornada) => {
          const dataJornada =
            new Date(
              jornada.inicio
            );

          return (
            dataJornada >=
            inicioPeriodo
          );
        }
      );
    }, [
      jornadas,
      filtro,
      periodoAplicado,
    ]);

  /*
   * Calcula os totais do
   * período selecionado.
   */
  const resumoPeriodo =
    useMemo(() => {
      return jornadasFiltradas.reduce(
        (
          resumo,
          jornada
        ) => {
          const km =
            jornada.km_final !==
              null &&
            jornada.km_final !==
              undefined
              ? jornada.km_final -
                jornada.km_inicial
              : 0;

          resumo.valor += Number(
            jornada.valor_recebido ||
              0
          );

          resumo.km += km;

          resumo.corridas +=
            jornada.quantidade_corridas ||
            0;

          resumo.jornadas += 1;

          return resumo;
        },
        {
          valor: 0,
          km: 0,
          corridas: 0,
          jornadas: 0,
        }
      );
    }, [
      jornadasFiltradas,
    ]);

  function formatarDinheiro(
    valor
  ) {
    return `R$ ${Number(valor)
      .toFixed(2)
      .replace('.', ',')}`;
  }

  function formatarData(data) {
    if (!data) {
      return '-';
    }

    return new Date(
      data
    ).toLocaleDateString(
      'pt-BR'
    );
  }

  function formatarHora(data) {
    if (!data) {
      return '-';
    }

    return new Date(
      data
    ).toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  }

  function calcularKm(
    jornada
  ) {
    if (
      jornada.km_final ===
        null ||
      jornada.km_final ===
        undefined
    ) {
      return 0;
    }

    return (
      jornada.km_final -
      jornada.km_inicial
    );
  }

  function renderizarJornada({
    item,
  }) {
    const veiculo =
      veiculos[
        item.veiculo_id
      ];

    const km =
      calcularKm(item);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate(
            'ResumoJornada',
            {
              jornadaId:
                item.id,
            }
          )
        }
      >
        <View
          style={
            styles.cardCabecalho
          }
        >
          <Text
            style={
              styles.cardData
            }
          >
            {formatarData(
              item.inicio
            )}
          </Text>

          <Text
            style={
              styles.cardValor
            }
          >
            {formatarDinheiro(
              item.valor_recebido ||
                0
            )}
          </Text>
        </View>

        <Text
          style={
            styles.cardVeiculo
          }
        >
          {veiculo
            ? `${veiculo.marca} ${veiculo.modelo}`
            : 'Veículo'}
        </Text>

        <Text
          style={
            styles.cardHorario
          }
        >
          {formatarHora(
            item.inicio
          )}{' '}
          →{' '}
          {formatarHora(
            item.fim
          )}
        </Text>

        <View
          style={
            styles.cardIndicadores
          }
        >
          <Text
            style={
              styles.indicador
            }
          >
            {item.quantidade_corridas ??
              0}{' '}
            corridas
          </Text>

          <Text
            style={
              styles.indicador
            }
          >
            {km} km
          </Text>
        </View>

        <Text
          style={
            styles.verDetalhes
          }
        >
          Ver detalhes →
        </Text>
      </TouchableOpacity>
    );
  }

  if (carregando) {
    return (
      <View
        style={
          styles.centralizado
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.textoCarregando
          }
        >
          Carregando histórico...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <Text
        style={
          styles.titulo
        }
      >
        Histórico
      </Text>

      <Text
        style={
          styles.subtitulo
        }
      >
        Acompanhe suas jornadas
        anteriores.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.filtros
        }
      >
        {FILTROS.map(
          (item) => {
            const selecionado =
              filtro ===
              item.value;

            return (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.filtro,
                  selecionado &&
                    styles.filtroSelecionado,
                ]}
                onPress={() => {
                  setFiltro(
                    item.value
                  );

                  if (
                    item.value !==
                    'periodo'
                  ) {
                    setPeriodoAplicado(
                      null
                    );
                  }
                }}
              >
                <Text
                  style={[
                    styles.textoFiltro,
                    selecionado &&
                      styles.textoFiltroSelecionado,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </ScrollView>

      {filtro ===
        'periodo' && (
        <View
          style={
            styles.periodoContainer
          }
        >
          <Text
            style={
              styles.periodoTitulo
            }
          >
            Período personalizado
          </Text>

          <Text
            style={
              styles.periodoAjuda
            }
          >
            Informe as duas datas no
            formato DD/MM/AAAA.
          </Text>

          <View
            style={
              styles.datasLinha
            }
          >
            <View
              style={
                styles.dataCampo
              }
            >
              <Text
                style={
                  styles.dataLabel
                }
              >
                Data inicial *
              </Text>

              <TextInput
                style={
                  styles.inputData
                }
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                maxLength={10}
                value={
                  dataInicial
                }
                onChangeText={(
                  texto
                ) =>
                  setDataInicial(
                    formatarEntradaData(
                      texto
                    )
                  )
                }
              />
            </View>

            <View
              style={
                styles.dataCampo
              }
            >
              <Text
                style={
                  styles.dataLabel
                }
              >
                Data final *
              </Text>

              <TextInput
                style={
                  styles.inputData
                }
                placeholder="DD/MM/AAAA"
                keyboardType="numeric"
                maxLength={10}
                value={
                  dataFinal
                }
                onChangeText={(
                  texto
                ) =>
                  setDataFinal(
                    formatarEntradaData(
                      texto
                    )
                  )
                }
              />
            </View>
          </View>

          <TouchableOpacity
            style={
              styles.botaoAplicar
            }
            onPress={
              aplicarPeriodo
            }
          >
            <Text
              style={
                styles.textoBotaoAplicar
              }
            >
              Aplicar período
            </Text>
          </TouchableOpacity>

          {periodoAplicado && (
            <TouchableOpacity
              style={
                styles.botaoLimpar
              }
              onPress={
                limparPeriodo
              }
            >
              <Text
                style={
                  styles.textoLimpar
                }
              >
                Limpar período
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View
        style={
          styles.resumo
        }
      >
        <View
          style={
            styles.resumoPrincipal
          }
        >
          <Text
            style={
              styles.resumoLabel
            }
          >
            Total recebido
          </Text>

          <Text
            style={
              styles.resumoValor
            }
          >
            {formatarDinheiro(
              resumoPeriodo.valor
            )}
          </Text>
        </View>

        <View
          style={
            styles.resumoLinha
          }
        >
          <View
            style={
              styles.resumoItem
            }
          >
            <Text
              style={
                styles.resumoNumero
              }
            >
              {
                resumoPeriodo.jornadas
              }
            </Text>

            <Text
              style={
                styles.resumoTexto
              }
            >
              Jornadas
            </Text>
          </View>

          <View
            style={
              styles.resumoItem
            }
          >
            <Text
              style={
                styles.resumoNumero
              }
            >
              {
                resumoPeriodo.corridas
              }
            </Text>

            <Text
              style={
                styles.resumoTexto
              }
            >
              Corridas
            </Text>
          </View>

          <View
            style={
              styles.resumoItem
            }
          >
            <Text
              style={
                styles.resumoNumero
              }
            >
              {
                resumoPeriodo.km
              }
            </Text>

            <Text
              style={
                styles.resumoTexto
              }
            >
              Km
            </Text>
          </View>
        </View>
      </View>

      <Text
        style={
          styles.listaTitulo
        }
      >
        Jornadas
      </Text>

      <FlatList
        data={
          jornadasFiltradas
        }
        keyExtractor={
          (item) => item.id
        }
        renderItem={
          renderizarJornada
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          jornadasFiltradas.length ===
          0
            ? styles.listaVazia
            : styles.lista
        }
        ListEmptyComponent={
          <View
            style={
              styles.vazio
            }
          >
            <Text
              style={
                styles.vazioTitulo
              }
            >
              Nenhuma jornada encontrada
            </Text>

            <Text
              style={
                styles.vazioTexto
              }
            >
              Não existem jornadas
              finalizadas neste período.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor:
        '#F5F6F8',
    },

    centralizado: {
      flex: 1,
      justifyContent:
        'center',
      alignItems: 'center',
      backgroundColor:
        '#F5F6F8',
    },

    textoCarregando: {
      marginTop: 12,
    },

    titulo: {
      fontSize: 30,
      fontWeight: 'bold',
      marginBottom: 5,
    },

    subtitulo: {
      fontSize: 15,
      marginBottom: 18,
    },

    filtros: {
      gap: 8,
      paddingRight: 15,
      marginBottom: 15,
    },

    filtro: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      borderRadius: 10,
      backgroundColor:
        '#FFFFFF',
    },

    filtroSelecionado: {
      backgroundColor:
        '#222222',
      borderColor:
        '#222222',
    },

    textoFiltro: {
      fontSize: 13,
      fontWeight: '600',
    },

    textoFiltroSelecionado: {
      color: '#FFFFFF',
    },

    periodoContainer: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E0E0E0',
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
    },

    periodoTitulo: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },

    periodoAjuda: {
      fontSize: 12,
      marginBottom: 12,
    },

    datasLinha: {
      flexDirection: 'row',
      gap: 10,
    },

    dataCampo: {
      flex: 1,
    },

    dataLabel: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 5,
    },

    inputData: {
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      borderRadius: 9,
      padding: 11,
      fontSize: 14,
      backgroundColor:
        '#F9F9F9',
    },

    botaoAplicar: {
      backgroundColor:
        '#222222',
      padding: 13,
      borderRadius: 9,
      alignItems: 'center',
      marginTop: 12,
    },

    textoBotaoAplicar: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },

    botaoLimpar: {
      alignItems: 'center',
      padding: 10,
      marginTop: 3,
    },

    textoLimpar: {
      fontSize: 13,
      fontWeight: '600',
    },

    resumo: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E0E0E0',
      borderRadius: 14,
      padding: 17,
      marginBottom: 20,
    },

    resumoPrincipal: {
      marginBottom: 15,
    },

    resumoLabel: {
      fontSize: 13,
      marginBottom: 4,
    },

    resumoValor: {
      fontSize: 26,
      fontWeight: 'bold',
    },

    resumoLinha: {
      flexDirection: 'row',
    },

    resumoItem: {
      flex: 1,
    },

    resumoNumero: {
      fontSize: 17,
      fontWeight: 'bold',
    },

    resumoTexto: {
      fontSize: 12,
      marginTop: 2,
    },

    listaTitulo: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },

    lista: {
      paddingBottom: 30,
    },

    listaVazia: {
      flexGrow: 1,
    },

    card: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E0E0E0',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },

    cardCabecalho: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    cardData: {
      fontSize: 15,
      fontWeight: '600',
    },

    cardValor: {
      fontSize: 18,
      fontWeight: 'bold',
    },

    cardVeiculo: {
      fontSize: 17,
      fontWeight: 'bold',
      marginBottom: 5,
    },

    cardHorario: {
      fontSize: 14,
      marginBottom: 10,
    },

    cardIndicadores: {
      flexDirection: 'row',
      gap: 15,
    },

    indicador: {
      fontSize: 14,
    },

    verDetalhes: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 12,
    },

    vazio: {
      paddingVertical: 40,
      alignItems: 'center',
    },

    vazioTitulo: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
    },

    vazioTexto: {
      fontSize: 14,
      textAlign: 'center',
    },
  });