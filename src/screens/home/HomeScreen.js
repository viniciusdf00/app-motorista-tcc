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
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
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
    label: 'Mês',
    value: 'mes',
  },
];

export default function HomeScreen({
  navigation,
}) {
  const [
    jornadaAtiva,
    setJornadaAtiva,
  ] = useState(null);

  const [
    jornadas,
    setJornadas,
  ] = useState([]);

  const [
    nomeUsuario,
    setNomeUsuario,
  ] = useState('');

  const [
    filtro,
    setFiltro,
  ] = useState('hoje');

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarDashboard();
    }, [])
  );

  async function carregarDashboard(
    atualizacaoManual = false
  ) {
    try {
      if (
        atualizacaoManual
      ) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        navigation.replace(
          'Login'
        );

        return;
      }

      /*
       * Nome do usuário
       */
      const {
        data: usuario,
        error: erroUsuario,
      } = await supabase
        .from('usuarios')
        .select('nome')
        .eq(
          'id',
          user.id
        )
        .single();

      if (
        !erroUsuario &&
        usuario
      ) {
        setNomeUsuario(
          usuario.nome || ''
        );
      }

      /*
       * Jornada em andamento
       */
      const {
        data: dadosJornadaAtiva,
        error: erroJornadaAtiva,
      } = await supabase
        .from('jornadas')
        .select(`
          id,
          inicio,
          km_inicial,
          veiculo_id
        `)
        .eq(
          'usuario_id',
          user.id
        )
        .eq(
          'status',
          'em_andamento'
        )
        .order(
          'inicio',
          {
            ascending: false,
          }
        )
        .limit(1);

      if (
        erroJornadaAtiva
      ) {
        console.log(
          'Erro ao verificar jornada ativa:',
          erroJornadaAtiva
        );
      } else if (
        dadosJornadaAtiva &&
        dadosJornadaAtiva.length >
          0
      ) {
        setJornadaAtiva(
          dadosJornadaAtiva[0]
        );
      } else {
        setJornadaAtiva(
          null
        );
      }

      /*
       * Jornadas finalizadas
       * do mês atual
       */
      const agora =
        new Date();

      const inicioMes =
        new Date(
          agora.getFullYear(),
          agora.getMonth(),
          1,
          0,
          0,
          0,
          0
        );

      const {
        data: dadosJornadas,
        error: erroJornadas,
      } = await supabase
        .from('jornadas')
        .select(`
          id,
          inicio,
          fim,
          km_inicial,
          km_final,
          quantidade_corridas,
          valor_recebido,
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
        .gte(
          'inicio',
          inicioMes.toISOString()
        )
        .order(
          'inicio',
          {
            ascending: false,
          }
        );

      if (
        erroJornadas
      ) {
        console.log(
          'Erro ao carregar dashboard:',
          erroJornadas
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar os dados do painel.'
        );

        return;
      }

      setJornadas(
        dadosJornadas || []
      );
    } catch (erro) {
      console.log(
        'Erro ao carregar dashboard:',
        erro
      );

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao carregar o painel.'
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  function inicioDoDia(
    data
  ) {
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

  /*
   * Filtra Hoje ou Mês
   */
  const jornadasFiltradas =
    useMemo(() => {
      if (
        filtro === 'mes'
      ) {
        return jornadas;
      }

      const hoje =
        inicioDoDia(
          new Date()
        );

      return jornadas.filter(
        (jornada) => {
          const dataJornada =
            inicioDoDia(
              new Date(
                jornada.inicio
              )
            );

          return (
            dataJornada.getTime() ===
            hoje.getTime()
          );
        }
      );
    }, [
      jornadas,
      filtro,
    ]);

  /*
   * Indicadores
   */
  const indicadores =
    useMemo(() => {
      return jornadasFiltradas.reduce(
        (
          total,
          jornada
        ) => {
          const valor =
            Number(
              jornada.valor_recebido ||
                0
            );

          const corridas =
            Number(
              jornada.quantidade_corridas ||
                0
            );

          let km = 0;

          if (
            jornada.km_final !==
              null &&
            jornada.km_final !==
              undefined
          ) {
            km =
              jornada.km_final -
              jornada.km_inicial;
          }

          let segundos = 0;

          if (
            jornada.inicio &&
            jornada.fim
          ) {
            segundos =
              Math.max(
                0,
                (
                  new Date(
                    jornada.fim
                  ) -
                  new Date(
                    jornada.inicio
                  )
                ) / 1000
              );
          }

          total.valor +=
            valor;

          total.corridas +=
            corridas;

          total.km +=
            km;

          total.segundos +=
            segundos;

          total.jornadas +=
            1;

          return total;
        },
        {
          valor: 0,
          corridas: 0,
          km: 0,
          segundos: 0,
          jornadas: 0,
        }
      );
    }, [
      jornadasFiltradas,
    ]);

  const horasTrabalhadas =
    indicadores.segundos /
    3600;

  const valorHora =
    horasTrabalhadas > 0
      ? indicadores.valor /
        horasTrabalhadas
      : 0;

  const valorKm =
    indicadores.km > 0
      ? indicadores.valor /
        indicadores.km
      : 0;

  const ultimaJornada =
    jornadasFiltradas.length >
    0
      ? jornadasFiltradas[0]
      : null;

  function formatarDinheiro(
    valor
  ) {
    return Number(
      valor || 0
    ).toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL',
      }
    );
  }

  function formatarHoras(
    segundos
  ) {
    const segundosTotais =
      Math.max(
        0,
        Math.floor(
          segundos || 0
        )
      );

    const horas =
      Math.floor(
        segundosTotais /
          3600
      );

    const minutos =
      Math.floor(
        (
          segundosTotais %
          3600
        ) / 60
      );

    if (
      horas === 0
    ) {
      return `${minutos}min`;
    }

    return `${horas}h ${String(
      minutos
    ).padStart(
      2,
      '0'
    )}min`;
  }

  function formatarHorario(
    data
  ) {
    if (!data) {
      return '';
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

  function formatarData(
    data
  ) {
    if (!data) {
      return '';
    }

    return new Date(
      data
    ).toLocaleDateString(
      'pt-BR'
    );
  }

  async function sair() {
    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      Alert.alert(
        'Erro',
        'Não foi possível sair do aplicativo.'
      );

      return;
    }

    navigation.replace(
      'Login'
    );
  }

  function abrirJornada() {
    if (
      jornadaAtiva
    ) {
      navigation.navigate(
        'JornadaAtiva',
        {
          jornadaId:
            jornadaAtiva.id,
        }
      );

      return;
    }

    navigation.navigate(
      'IniciarJornada'
    );
  }

  if (
    carregando
  ) {
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
          Carregando painel...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.conteudo
      }
      showsVerticalScrollIndicator={
        false
      }
      refreshControl={
        <RefreshControl
          refreshing={
            atualizando
          }
          onRefresh={() =>
            carregarDashboard(
              true
            )
          }
        />
      }
    >
      {/* CABEÇALHO */}

      <View
        style={
          styles.cabecalho
        }
      >
        <View
          style={
            styles.cabecalhoTexto
          }
        >
          <Text
            style={
              styles.titulo
            }
          >
            App Motorista
          </Text>

          <Text
            style={
              styles.saudacao
            }
          >
            {nomeUsuario
              ? `Olá, ${nomeUsuario}!`
              : 'Bem-vindo!'}
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.botaoSairTopo
          }
          onPress={
            sair
          }
        >
          <Text
            style={
              styles.textoSairTopo
            }
          >
            Sair
          </Text>
        </TouchableOpacity>
      </View>

      {/* JORNADA ATIVA */}

      {jornadaAtiva && (
        <TouchableOpacity
          style={
            styles.jornadaAtiva
          }
          onPress={
            abrirJornada
          }
        >
          <View
            style={
              styles.jornadaAtivaCabecalho
            }
          >
            <Text
              style={
                styles.jornadaAtivaStatus
              }
            >
              ● JORNADA EM ANDAMENTO
            </Text>

            <Text
              style={
                styles.continuar
              }
            >
              Continuar →
            </Text>
          </View>

          <Text
            style={
              styles.jornadaAtivaTitulo
            }
          >
            Jornada iniciada às{' '}
            {formatarHorario(
              jornadaAtiva.inicio
            )}
          </Text>

          <Text
            style={
              styles.jornadaAtivaTexto
            }
          >
            Toque para acompanhar ou
            finalizar sua jornada.
          </Text>
        </TouchableOpacity>
      )}

      {!jornadaAtiva && (
        <TouchableOpacity
          style={
            styles.botaoIniciar
          }
          onPress={
            abrirJornada
          }
        >
          <Text
            style={
              styles.textoBotaoIniciar
            }
          >
            Iniciar jornada
          </Text>
        </TouchableOpacity>
      )}

      {/* DESEMPENHO */}

      <Text
        style={
          styles.secaoTitulo
        }
      >
        Seu desempenho
      </Text>

      <Text
        style={
          styles.secaoSubtitulo
        }
      >
        Indicadores das jornadas
        finalizadas
      </Text>

      <View
        style={
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
                key={
                  item.value
                }
                style={[
                  styles.filtro,
                  selecionado &&
                    styles.filtroSelecionado,
                ]}
                onPress={() =>
                  setFiltro(
                    item.value
                  )
                }
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
      </View>

      {/* TOTAL RECEBIDO */}

      <View
        style={
          styles.cardDestaque
        }
      >
        <Text
          style={
            styles.destaqueLabel
          }
        >
          Total recebido
        </Text>

        <Text
          style={
            styles.destaqueValor
          }
        >
          {formatarDinheiro(
            indicadores.valor
          )}
        </Text>

        <Text
          style={
            styles.destaquePeriodo
          }
        >
          {filtro === 'hoje'
            ? 'Hoje'
            : 'Neste mês'}
        </Text>
      </View>

      {/* INDICADORES */}

      <View
        style={
          styles.grade
        }
      >
        <View
          style={
            styles.cardIndicador
          }
        >
          <Text
            style={
              styles.indicadorLabel
            }
          >
            Horas
          </Text>

          <Text
            style={
              styles.indicadorValor
            }
          >
            {formatarHoras(
              indicadores.segundos
            )}
          </Text>
        </View>

        <View
          style={
            styles.cardIndicador
          }
        >
          <Text
            style={
              styles.indicadorLabel
            }
          >
            Corridas
          </Text>

          <Text
            style={
              styles.indicadorValor
            }
          >
            {
              indicadores.corridas
            }
          </Text>
        </View>

        <View
          style={
            styles.cardIndicador
          }
        >
          <Text
            style={
              styles.indicadorLabel
            }
          >
            Distância
          </Text>

          <Text
            style={
              styles.indicadorValor
            }
          >
            {
              indicadores.km
            }{' '}
            km
          </Text>
        </View>

        <View
          style={
            styles.cardIndicador
          }
        >
          <Text
            style={
              styles.indicadorLabel
            }
          >
            Jornadas
          </Text>

          <Text
            style={
              styles.indicadorValor
            }
          >
            {
              indicadores.jornadas
            }
          </Text>
        </View>

        <View
          style={
            styles.cardIndicador
          }
        >
          <Text
            style={
              styles.indicadorLabel
            }
          >
            R$/hora
          </Text>

          <Text
            style={
              styles.indicadorValor
            }
          >
            {formatarDinheiro(
              valorHora
            )}
          </Text>
        </View>

        <View
          style={
            styles.cardIndicador
          }
        >
          <Text
            style={
              styles.indicadorLabel
            }
          >
            R$/km
          </Text>

          <Text
            style={
              styles.indicadorValor
            }
          >
            {formatarDinheiro(
              valorKm
            )}
          </Text>
        </View>
      </View>

      {indicadores.jornadas ===
        0 && (
        <View
          style={
            styles.semDados
          }
        >
          <Text
            style={
              styles.semDadosTitulo
            }
          >
            Nenhuma jornada finalizada
          </Text>

          <Text
            style={
              styles.semDadosTexto
            }
          >
            Os indicadores aparecerão
            aqui após a conclusão de uma
            jornada neste período.
          </Text>
        </View>
      )}

      {/* ÚLTIMA JORNADA */}

      {ultimaJornada && (
        <View
          style={
            styles.blocoSecao
          }
        >
          <Text
            style={
              styles.secaoTitulo
            }
          >
            Última jornada
          </Text>

          <TouchableOpacity
            style={
              styles.ultimaJornada
            }
            onPress={() =>
              navigation.navigate(
                'ResumoJornada',
                {
                  jornadaId:
                    ultimaJornada.id,
                }
              )
            }
          >
            <View
              style={
                styles.ultimaLinha
              }
            >
              <Text
                style={
                  styles.ultimaData
                }
              >
                {formatarData(
                  ultimaJornada.inicio
                )}
              </Text>

              <Text
                style={
                  styles.ultimaValor
                }
              >
                {formatarDinheiro(
                  ultimaJornada.valor_recebido
                )}
              </Text>
            </View>

            <Text
              style={
                styles.ultimaHorario
              }
            >
              {formatarHorario(
                ultimaJornada.inicio
              )}{' '}
              →{' '}
              {formatarHorario(
                ultimaJornada.fim
              )}
            </Text>

            <Text
              style={
                styles.verDetalhes
              }
            >
              Ver resumo →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ACESSO RÁPIDO */}

      <View
        style={
          styles.acessoRapido
        }
      >
        <Text
          style={
            styles.secaoTitulo
          }
        >
          Acesso rápido
        </Text>

        {/* HISTÓRICO */}

        <TouchableOpacity
          style={
            styles.botaoSecundario
          }
          onPress={() =>
            navigation.navigate(
              'HistoricoJornadas'
            )
          }
        >
          <View
            style={
              styles.botaoConteudo
            }
          >
            <Text
              style={
                styles.botaoSecundarioTitulo
              }
            >
              Histórico de jornadas
            </Text>

            <Text
              style={
                styles.botaoSecundarioDescricao
              }
            >
              Consulte suas jornadas e
              períodos anteriores
            </Text>
          </View>

          <Text
            style={
              styles.seta
            }
          >
            →
          </Text>
        </TouchableOpacity>

        {/* DESPESAS */}

        <TouchableOpacity
          style={
            styles.botaoSecundario
          }
          onPress={() =>
            navigation.navigate(
              'Despesas'
            )
          }
        >
          <View
            style={
              styles.botaoConteudo
            }
          >
            <Text
              style={
                styles.botaoSecundarioTitulo
              }
            >
              Despesas
            </Text>

            <Text
              style={
                styles.botaoSecundarioDescricao
              }
            >
              Registre e acompanhe seus
              gastos
            </Text>
          </View>

          <Text
            style={
              styles.seta
            }
          >
            →
          </Text>
        </TouchableOpacity>

        {/* ABASTECIMENTOS */}

        <TouchableOpacity
          style={
            styles.botaoSecundario
          }
          onPress={() =>
            navigation.navigate(
              'Abastecimentos'
            )
          }
        >
          <View
            style={
              styles.botaoConteudo
            }
          >
            <Text
              style={
                styles.botaoSecundarioTitulo
              }
            >
              Abastecimentos
            </Text>

            <Text
              style={
                styles.botaoSecundarioDescricao
              }
            >
              Registre e acompanhe seus
              gastos com combustível
            </Text>
          </View>

          <Text
            style={
              styles.seta
            }
          >
            →
          </Text>
        </TouchableOpacity>

        {/* MANUTENÇÕES */}

        <TouchableOpacity
          style={
            styles.botaoSecundario
          }
          onPress={() =>
            navigation.navigate(
              'Manutencoes'
            )
          }
        >
          <View
            style={
              styles.botaoConteudo
            }
          >
            <Text
              style={
                styles.botaoSecundarioTitulo
              }
            >
              Manutenções
            </Text>

            <Text
              style={
                styles.botaoSecundarioDescricao
              }
            >
              Registre serviços e
              acompanhe próximas
              manutenções
            </Text>
          </View>

          <Text
            style={
              styles.seta
            }
          >
            →
          </Text>
        </TouchableOpacity>

        {/* VEÍCULOS */}

        <TouchableOpacity
          style={
            styles.botaoSecundario
          }
          onPress={() =>
            navigation.navigate(
              'MeusVeiculos'
            )
          }
        >
          <View
            style={
              styles.botaoConteudo
            }
          >
            <Text
              style={
                styles.botaoSecundarioTitulo
              }
            >
              Meus veículos
            </Text>

            <Text
              style={
                styles.botaoSecundarioDescricao
              }
            >
              Cadastre e gerencie seus
              veículos
            </Text>
          </View>

          <Text
            style={
              styles.seta
            }
          >
            →
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F5F6F8',
    },

    conteudo: {
      padding: 20,
      paddingTop: 55,
      paddingBottom: 50,
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
      fontSize: 14,
    },

    cabecalho: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      marginBottom: 22,
    },

    cabecalhoTexto: {
      flex: 1,
      paddingRight: 10,
    },

    titulo: {
      fontSize: 30,
      fontWeight: 'bold',
    },

    saudacao: {
      fontSize: 16,
      marginTop: 4,
    },

    botaoSairTopo: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },

    textoSairTopo: {
      fontSize: 14,
      fontWeight: '600',
    },

    jornadaAtiva: {
      backgroundColor:
        '#222222',
      borderRadius: 14,
      padding: 18,
      marginBottom: 22,
    },

    jornadaAtivaCabecalho: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },

    jornadaAtivaStatus: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },

    continuar: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },

    jornadaAtivaTitulo: {
      color: '#FFFFFF',
      fontSize: 19,
      fontWeight: 'bold',
      marginBottom: 5,
    },

    jornadaAtivaTexto: {
      color: '#FFFFFF',
      fontSize: 13,
      lineHeight: 19,
    },

    botaoIniciar: {
      backgroundColor:
        '#222222',
      borderRadius: 12,
      padding: 17,
      alignItems: 'center',
      marginBottom: 24,
    },

    textoBotaoIniciar: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },

    secaoTitulo: {
      fontSize: 19,
      fontWeight: 'bold',
      marginBottom: 5,
      marginTop: 4,
    },

    secaoSubtitulo: {
      fontSize: 13,
      marginBottom: 14,
    },

    filtros: {
      flexDirection: 'row',
      marginBottom: 14,
      gap: 8,
    },

    filtro: {
      paddingVertical: 9,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
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

    cardDestaque: {
      backgroundColor:
        '#222222',
      borderRadius: 14,
      padding: 20,
      marginBottom: 12,
    },

    destaqueLabel: {
      color: '#FFFFFF',
      fontSize: 13,
      marginBottom: 5,
    },

    destaqueValor: {
      color: '#FFFFFF',
      fontSize: 30,
      fontWeight: 'bold',
    },

    destaquePeriodo: {
      color: '#FFFFFF',
      fontSize: 12,
      marginTop: 6,
    },

    grade: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent:
        'space-between',
      marginBottom: 10,
    },

    cardIndicador: {
      width: '48%',
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E0E0E0',
      borderRadius: 12,
      padding: 15,
      marginBottom: 11,
    },

    indicadorLabel: {
      fontSize: 12,
      marginBottom: 7,
    },

    indicadorValor: {
      fontSize: 18,
      fontWeight: 'bold',
    },

    semDados: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E0E0E0',
      borderRadius: 12,
      padding: 18,
      marginBottom: 20,
    },

    semDadosTitulo: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5,
    },

    semDadosTexto: {
      fontSize: 13,
      lineHeight: 19,
    },

    blocoSecao: {
      marginBottom: 4,
    },

    ultimaJornada: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E0E0E0',
      borderRadius: 12,
      padding: 16,
      marginTop: 7,
      marginBottom: 22,
    },

    ultimaLinha: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    ultimaData: {
      fontSize: 14,
      fontWeight: '600',
    },

    ultimaValor: {
      fontSize: 18,
      fontWeight: 'bold',
    },

    ultimaHorario: {
      fontSize: 14,
      marginTop: 8,
    },

    verDetalhes: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 12,
    },

    acessoRapido: {
      width: '100%',
    },

    botaoSecundario: {
      width: '100%',
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDDDDD',
      borderRadius: 12,
      padding: 16,
      marginTop: 10,
    },

    botaoConteudo: {
      flex: 1,
      paddingRight: 15,
    },

    botaoSecundarioTitulo: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },

    botaoSecundarioDescricao: {
      fontSize: 12,
      lineHeight: 17,
    },

    seta: {
      fontSize: 20,
      fontWeight: 'bold',
      flexShrink: 0,
    },
  });