import {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import { supabase } from '../../services/supabase';

export default function FuelingsScreen({
  navigation,
}) {
  const [
    abastecimentos,
    setAbastecimentos,
  ] = useState([]);

  const [
    veiculos,
    setVeiculos,
  ] = useState({});

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  async function carregarDados() {
    try {
      setCarregando(true);

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

      const {
        data: dadosAbastecimentos,
        error: erroAbastecimentos,
      } = await supabase
        .from('abastecimentos')
        .select(`
          id,
          usuario_id,
          veiculo_id,
          tipo_combustivel,
          quantidade_litros,
          valor_total,
          quilometragem,
          data_abastecimento,
          tanque_completo,
          posto,
          observacao,
          criado_em
        `)
        .eq(
          'usuario_id',
          user.id
        )
        .order(
          'data_abastecimento',
          {
            ascending: false,
          }
        )
        .order(
          'criado_em',
          {
            ascending: false,
          }
        );

      if (
        erroAbastecimentos
      ) {
        console.log(
          'Erro abastecimentos:',
          erroAbastecimentos
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar os abastecimentos.'
        );

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
        .eq(
          'usuario_id',
          user.id
        );

      if (
        erroVeiculos
      ) {
        console.log(
          'Erro veículos:',
          erroVeiculos
        );
      }

      const mapaVeiculos = {};

      (dadosVeiculos || []).forEach(
        (veiculo) => {
          mapaVeiculos[
            veiculo.id
          ] = veiculo;
        }
      );

      setVeiculos(
        mapaVeiculos
      );

      setAbastecimentos(
        dadosAbastecimentos || []
      );
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao carregar os abastecimentos.'
      );
    } finally {
      setCarregando(false);
    }
  }

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

  function formatarNumero(
    valor,
    casas = 2
  ) {
    return Number(
      valor || 0
    ).toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits:
          casas,
        maximumFractionDigits:
          casas,
      }
    );
  }

  function formatarData(
    data
  ) {
    if (!data) {
      return '-';
    }

    const partes =
      data.split('-');

    if (
      partes.length !== 3
    ) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function nomeCombustivel(
    tipo
  ) {
    const nomes = {
      gasolina: 'Gasolina',
      etanol: 'Etanol',
      diesel: 'Diesel',
      gnv: 'GNV',
    };

    return (
      nomes[tipo] ||
      tipo
    );
  }

  function confirmarExclusao(
    abastecimento
  ) {
    Alert.alert(
      'Excluir abastecimento',
      'Deseja realmente excluir este abastecimento?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirAbastecimento(
              abastecimento.id
            ),
        },
      ]
    );
  }

  async function excluirAbastecimento(
    abastecimentoId
  ) {
    const {
      error,
    } = await supabase
      .from('abastecimentos')
      .delete()
      .eq(
        'id',
        abastecimentoId
      );

    if (error) {
      console.log(
        'Erro ao excluir:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível excluir o abastecimento.'
      );

      return;
    }

    carregarDados();
  }

  const totalGasto =
    abastecimentos.reduce(
      (
        total,
        abastecimento
      ) =>
        total +
        Number(
          abastecimento.valor_total ||
            0
        ),
      0
    );

  const totalLitros =
    abastecimentos.reduce(
      (
        total,
        abastecimento
      ) =>
        total +
        Number(
          abastecimento.quantidade_litros ||
            0
        ),
      0
    );

  function renderizarAbastecimento({
    item,
  }) {
    const veiculo =
      veiculos[
        item.veiculo_id
      ];

    const litros =
      Number(
        item.quantidade_litros ||
          0
      );

    const valor =
      Number(
        item.valor_total ||
          0
      );

    const precoLitro =
      litros > 0
        ? valor / litros
        : 0;

    return (
      <View
        style={
          styles.card
        }
      >
        <View
          style={
            styles.cardCabecalho
          }
        >
          <View
            style={
              styles.cardConteudo
            }
          >
            <Text
              style={
                styles.combustivel
              }
            >
              {nomeCombustivel(
                item.tipo_combustivel
              )}
            </Text>

            <Text
              style={
                styles.veiculo
              }
            >
              {veiculo
                ? `${veiculo.marca} ${veiculo.modelo}`
                : 'Veículo'}
            </Text>
          </View>

          <Text
            style={
              styles.valor
            }
          >
            {formatarDinheiro(
              item.valor_total
            )}
          </Text>
        </View>

        <View
          style={
            styles.informacoes
          }
        >
          <Text
            style={
              styles.info
            }
          >
            {formatarNumero(
              item.quantidade_litros,
              3
            )}{' '}
            L
          </Text>

          <Text
            style={
              styles.info
            }
          >
            {formatarDinheiro(
              precoLitro
            )}
            /L
          </Text>

          <Text
            style={
              styles.info
            }
          >
            {item.quilometragem}{' '}
            km
          </Text>
        </View>

        <Text
          style={
            styles.data
          }
        >
          {formatarData(
            item.data_abastecimento
          )}
        </Text>

        {item.tanque_completo && (
          <Text
            style={
              styles.tanque
            }
          >
            Tanque completo
          </Text>
        )}

        {item.posto && (
          <Text
            style={
              styles.detalhe
            }
          >
            Posto: {item.posto}
          </Text>
        )}

        {item.observacao && (
          <Text
            style={
              styles.observacao
            }
          >
            {item.observacao}
          </Text>
        )}

        <View
          style={
            styles.acoes
          }
        >
          <TouchableOpacity
            style={
              styles.botaoAcao
            }
            onPress={() =>
              navigation.navigate(
                'EditarAbastecimento',
                {
                  abastecimento:
                    item,
                }
              )
            }
          >
            <Text
              style={
                styles.textoAcao
              }
            >
              Editar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.botaoAcao
            }
            onPress={() =>
              confirmarExclusao(
                item
              )
            }
          >
            <Text
              style={
                styles.textoAcao
              }
            >
              Excluir
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
            styles.carregando
          }
        >
          Carregando abastecimentos...
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
      <View
        style={
          styles.cabecalho
        }
      >
        <View>
          <Text
            style={
              styles.titulo
            }
          >
            Abastecimentos
          </Text>

          <Text
            style={
              styles.subtitulo
            }
          >
            Acompanhe os gastos com
            combustível
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.botaoNovo
          }
          onPress={() =>
            navigation.navigate(
              'CadastrarAbastecimento'
            )
          }
        >
          <Text
            style={
              styles.textoNovo
            }
          >
            + Novo
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={
          styles.resumo
        }
      >
        <View>
          <Text
            style={
              styles.resumoLabel
            }
          >
            Total gasto
          </Text>

          <Text
            style={
              styles.resumoValor
            }
          >
            {formatarDinheiro(
              totalGasto
            )}
          </Text>
        </View>

        <View
          style={
            styles.resumoRodape
          }
        >
          <Text
            style={
              styles.resumoDetalhe
            }
          >
            {abastecimentos.length}{' '}
            abastecimentos
          </Text>

          <Text
            style={
              styles.resumoDetalhe
            }
          >
            {formatarNumero(
              totalLitros,
              2
            )}{' '}
            L
          </Text>
        </View>
      </View>

      <FlatList
        data={
          abastecimentos
        }
        keyExtractor={
          (item) =>
            item.id
        }
        renderItem={
          renderizarAbastecimento
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          abastecimentos.length ===
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
              Nenhum abastecimento
            </Text>

            <Text
              style={
                styles.vazioTexto
              }
            >
              Cadastre o primeiro
              abastecimento do veículo.
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

    carregando: {
      marginTop: 12,
    },

    cabecalho: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },

    titulo: {
      fontSize: 28,
      fontWeight: 'bold',
    },

    subtitulo: {
      fontSize: 13,
      marginTop: 4,
      maxWidth: 220,
    },

    botaoNovo: {
      backgroundColor:
        '#222222',
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 10,
    },

    textoNovo: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },

    resumo: {
      backgroundColor:
        '#222222',
      borderRadius: 13,
      padding: 18,
      marginBottom: 18,
    },

    resumoLabel: {
      color: '#FFFFFF',
      fontSize: 13,
      marginBottom: 5,
    },

    resumoValor: {
      color: '#FFFFFF',
      fontSize: 27,
      fontWeight: 'bold',
    },

    resumoRodape: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      marginTop: 12,
    },

    resumoDetalhe: {
      color: '#FFFFFF',
      fontSize: 12,
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
    },

    cardConteudo: {
      flex: 1,
    },

    combustivel: {
      fontSize: 17,
      fontWeight: 'bold',
    },

    veiculo: {
      fontSize: 13,
      marginTop: 4,
    },

    valor: {
      fontSize: 18,
      fontWeight: 'bold',
    },

    informacoes: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
      marginTop: 13,
    },

    info: {
      fontSize: 14,
      fontWeight: '600',
    },

    data: {
      fontSize: 13,
      marginTop: 11,
    },

    tanque: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 7,
    },

    detalhe: {
      fontSize: 13,
      marginTop: 6,
    },

    observacao: {
      fontSize: 13,
      lineHeight: 18,
      marginTop: 7,
    },

    acoes: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },

    botaoAcao: {
      flex: 1,
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      borderRadius: 8,
      padding: 11,
      alignItems: 'center',
    },

    textoAcao: {
      fontWeight: '600',
    },

    vazio: {
      alignItems: 'center',
      paddingVertical: 50,
    },

    vazioTitulo: {
      fontSize: 18,
      fontWeight: 'bold',
    },

    vazioTexto: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 6,
    },
  });