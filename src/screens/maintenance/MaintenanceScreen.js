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

export default function MaintenanceScreen({
  navigation,
}) {
  const [
    manutencoes,
    setManutencoes,
  ] = useState([]);

  const [
    veiculos,
    setVeiculos,
  ] = useState({});

  const [
    tipos,
    setTipos,
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
      } = await supabase.auth.getUser();

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
        data: dadosManutencoes,
        error: erroManutencoes,
      } = await supabase
        .from('manutencoes')
        .select(`
          id,
          usuario_id,
          veiculo_id,
          tipo_manutencao_id,
          descricao,
          valor,
          quilometragem,
          data_manutencao,
          proxima_data,
          proxima_quilometragem,
          oficina,
          observacao,
          criado_em
        `)
        .eq(
          'usuario_id',
          user.id
        )
        .order(
          'data_manutencao',
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

      if (erroManutencoes) {
        console.log(
          'Erro manutenções:',
          erroManutencoes
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar as manutenções.'
        );

        return;
      }

      const {
        data: dadosVeiculos,
      } = await supabase
        .from('veiculos')
        .select(
          'id, marca, modelo, placa'
        )
        .eq(
          'usuario_id',
          user.id
        );

      const {
        data: dadosTipos,
      } = await supabase
        .from('tipos_manutencao')
        .select('id, nome')
        .eq('ativo', true);

      const mapaVeiculos = {};

      (dadosVeiculos || []).forEach(
        (veiculo) => {
          mapaVeiculos[
            veiculo.id
          ] = veiculo;
        }
      );

      const mapaTipos = {};

      (dadosTipos || []).forEach(
        (tipo) => {
          mapaTipos[
            tipo.id
          ] = tipo;
        }
      );

      setVeiculos(
        mapaVeiculos
      );

      setTipos(
        mapaTipos
      );

      setManutencoes(
        dadosManutencoes || []
      );
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao carregar as manutenções.'
      );
    } finally {
      setCarregando(false);
    }
  }

  function formatarDinheiro(
    valor
  ) {
    if (
      valor === null ||
      valor === undefined
    ) {
      return '-';
    }

    return Number(
      valor
    ).toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL',
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

  function confirmarExclusao(
    manutencao
  ) {
    Alert.alert(
      'Excluir manutenção',
      `Deseja excluir "${manutencao.descricao}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirManutencao(
              manutencao.id
            ),
        },
      ]
    );
  }

  async function excluirManutencao(
    manutencaoId
  ) {
    const {
      error,
    } = await supabase
      .from('manutencoes')
      .delete()
      .eq(
        'id',
        manutencaoId
      );

    if (error) {
      console.log(
        'Erro ao excluir manutenção:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível excluir a manutenção.'
      );

      return;
    }

    carregarDados();
  }

  const totalGasto =
    manutencoes.reduce(
      (
        total,
        manutencao
      ) =>
        total +
        Number(
          manutencao.valor || 0
        ),
      0
    );

  function renderizarManutencao({
    item,
  }) {
    const veiculo =
      veiculos[
        item.veiculo_id
      ];

    const tipo =
      tipos[
        item.tipo_manutencao_id
      ];

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
                styles.descricao
              }
            >
              {item.descricao}
            </Text>

            <Text
              style={
                styles.tipo
              }
            >
              {tipo?.nome ||
                'Manutenção'}
            </Text>
          </View>

          <Text
            style={
              styles.valor
            }
          >
            {formatarDinheiro(
              item.valor
            )}
          </Text>
        </View>

        <Text
          style={
            styles.veiculo
          }
        >
          {veiculo
            ? `${veiculo.marca} ${veiculo.modelo}`
            : 'Veículo'}
        </Text>

        <Text
          style={
            styles.data
          }
        >
          Realizada em:{' '}
          {formatarData(
            item.data_manutencao
          )}
        </Text>

        {item.quilometragem !==
          null &&
          item.quilometragem !==
            undefined && (
          <Text
            style={
              styles.detalhe
            }
          >
            Quilometragem:{' '}
            {item.quilometragem} km
          </Text>
        )}

        {item.oficina && (
          <Text
            style={
              styles.detalhe
            }
          >
            Oficina: {item.oficina}
          </Text>
        )}

        {(item.proxima_data ||
          item.proxima_quilometragem !==
            null) && (
          <View
            style={
              styles.proxima
            }
          >
            <Text
              style={
                styles.proximaTitulo
              }
            >
              Próxima manutenção
            </Text>

            {item.proxima_data && (
              <Text
                style={
                  styles.proximaTexto
                }
              >
                Data:{' '}
                {formatarData(
                  item.proxima_data
                )}
              </Text>
            )}

            {item.proxima_quilometragem !==
              null &&
              item.proxima_quilometragem !==
                undefined && (
              <Text
                style={
                  styles.proximaTexto
                }
              >
                KM:{' '}
                {
                  item.proxima_quilometragem
                }{' '}
                km
              </Text>
            )}
          </View>
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
                'EditarManutencao',
                {
                  manutencao:
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
            styles.carregando
          }
        >
          Carregando manutenções...
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
            Manutenções
          </Text>

          <Text
            style={
              styles.subtitulo
            }
          >
            Histórico do veículo
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.botaoNovo
          }
          onPress={() =>
            navigation.navigate(
              'CadastrarManutencao'
            )
          }
        >
          <Text
            style={
              styles.textoNovo
            }
          >
            + Nova
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={
          styles.resumo
        }
      >
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

        <Text
          style={
            styles.resumoDetalhe
          }
        >
          {manutencoes.length}{' '}
          manutenções registradas
        </Text>
      </View>

      <FlatList
        data={
          manutencoes
        }
        keyExtractor={
          (item) =>
            item.id
        }
        renderItem={
          renderizarManutencao
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          manutencoes.length === 0
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
              Nenhuma manutenção
            </Text>

            <Text
              style={
                styles.vazioTexto
              }
            >
              Registre a primeira
              manutenção do veículo.
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
      fontSize: 29,
      fontWeight: 'bold',
    },

    subtitulo: {
      fontSize: 14,
      marginTop: 3,
    },

    botaoNovo: {
      backgroundColor:
        '#222222',
      paddingVertical: 11,
      paddingHorizontal: 15,
      borderRadius: 10,
    },

    textoNovo: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },

    resumo: {
      backgroundColor:
        '#222222',
      padding: 18,
      borderRadius: 13,
      marginBottom: 18,
    },

    resumoLabel: {
      color: '#FFFFFF',
      fontSize: 13,
    },

    resumoValor: {
      color: '#FFFFFF',
      fontSize: 27,
      fontWeight: 'bold',
      marginTop: 4,
    },

    resumoDetalhe: {
      color: '#FFFFFF',
      fontSize: 12,
      marginTop: 8,
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
      paddingRight: 10,
    },

    descricao: {
      fontSize: 17,
      fontWeight: 'bold',
    },

    tipo: {
      fontSize: 13,
      marginTop: 4,
    },

    valor: {
      fontSize: 17,
      fontWeight: 'bold',
    },

    veiculo: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 12,
    },

    data: {
      fontSize: 13,
      marginTop: 7,
    },

    detalhe: {
      fontSize: 13,
      marginTop: 5,
    },

    proxima: {
      backgroundColor:
        '#F5F6F8',
      padding: 12,
      borderRadius: 9,
      marginTop: 12,
    },

    proximaTitulo: {
      fontSize: 13,
      fontWeight: 'bold',
      marginBottom: 4,
    },

    proximaTexto: {
      fontSize: 13,
      marginTop: 2,
    },

    observacao: {
      fontSize: 13,
      lineHeight: 18,
      marginTop: 10,
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
      marginTop: 6,
      textAlign: 'center',
    },
  });