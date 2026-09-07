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

export default function ExpensesScreen({
  navigation,
}) {
  const [despesas, setDespesas] =
    useState([]);

  const [categorias, setCategorias] =
    useState({});

  const [veiculos, setVeiculos] =
    useState({});

  const [carregando, setCarregando] =
    useState(true);

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

      if (userError || !user) {
        navigation.replace('Login');
        return;
      }

      const {
        data: dadosDespesas,
        error: erroDespesas,
      } = await supabase
        .from('despesas')
        .select(`
          id,
          usuario_id,
          veiculo_id,
          categoria_id,
          descricao,
          valor,
          data_despesa,
          observacao,
          criado_em
        `)
        .eq(
          'usuario_id',
          user.id
        )
        .order(
          'data_despesa',
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

      if (erroDespesas) {
        console.log(
          'Erro despesas:',
          erroDespesas
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar as despesas.'
        );

        return;
      }

      const {
        data: dadosCategorias,
        error: erroCategorias,
      } = await supabase
        .from('categorias_despesa')
        .select('id, nome')
        .eq('ativo', true);

      if (erroCategorias) {
        console.log(
          'Erro categorias:',
          erroCategorias
        );
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

      if (erroVeiculos) {
        console.log(
          'Erro veículos:',
          erroVeiculos
        );
      }

      const mapaCategorias = {};

      (dadosCategorias || []).forEach(
        (categoria) => {
          mapaCategorias[
            categoria.id
          ] = categoria;
        }
      );

      const mapaVeiculos = {};

      (dadosVeiculos || []).forEach(
        (veiculo) => {
          mapaVeiculos[
            veiculo.id
          ] = veiculo;
        }
      );

      setCategorias(
        mapaCategorias
      );

      setVeiculos(
        mapaVeiculos
      );

      setDespesas(
        dadosDespesas || []
      );
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao carregar as despesas.'
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

  function formatarData(
    data
  ) {
    if (!data) {
      return '-';
    }

    const partes =
      data.split('-');

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function confirmarExclusao(
    despesa
  ) {
    Alert.alert(
      'Excluir despesa',
      `Deseja excluir "${despesa.descricao}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            excluirDespesa(
              despesa.id
            ),
        },
      ]
    );
  }

  async function excluirDespesa(
    despesaId
  ) {
    const { error } =
      await supabase
        .from('despesas')
        .delete()
        .eq(
          'id',
          despesaId
        );

    if (error) {
      console.log(
        'Erro ao excluir:',
        error
      );

      Alert.alert(
        'Erro',
        'Não foi possível excluir a despesa.'
      );

      return;
    }

    carregarDados();
  }

  const total =
    despesas.reduce(
      (soma, despesa) =>
        soma +
        Number(
          despesa.valor || 0
        ),
      0
    );

  function renderizarDespesa({
    item,
  }) {
    const categoria =
      categorias[
        item.categoria_id
      ];

    const veiculo =
      item.veiculo_id
        ? veiculos[
            item.veiculo_id
          ]
        : null;

    return (
      <View style={styles.card}>
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
                styles.categoria
              }
            >
              {categoria?.nome ||
                'Categoria'}
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
            styles.data
          }
        >
          {formatarData(
            item.data_despesa
          )}
        </Text>

        {veiculo && (
          <Text
            style={
              styles.veiculo
            }
          >
            {veiculo.marca}{' '}
            {veiculo.modelo}
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
              styles.botaoEditar
            }
            onPress={() =>
              navigation.navigate(
                'EditarDespesa',
                {
                  despesa:
                    item,
                }
              )
            }
          >
            <Text
              style={
                styles.textoEditar
              }
            >
              Editar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.botaoExcluir
            }
            onPress={() =>
              confirmarExclusao(
                item
              )
            }
          >
            <Text
              style={
                styles.textoExcluir
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
          Carregando despesas...
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
            Despesas
          </Text>

          <Text
            style={
              styles.subtitulo
            }
          >
            Controle seus gastos
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.botaoNovo
          }
          onPress={() =>
            navigation.navigate(
              'CadastrarDespesa'
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
          styles.totalCard
        }
      >
        <Text
          style={
            styles.totalLabel
          }
        >
          Total registrado
        </Text>

        <Text
          style={
            styles.totalValor
          }
        >
          {formatarDinheiro(
            total
          )}
        </Text>
      </View>

      <FlatList
        data={despesas}
        keyExtractor={
          (item) => item.id
        }
        renderItem={
          renderizarDespesa
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          despesas.length === 0
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
              Nenhuma despesa
            </Text>

            <Text
              style={
                styles.vazioTexto
              }
            >
              Cadastre seu primeiro
              gasto para começar o
              acompanhamento.
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
      backgroundColor:
        '#F5F6F8',
      padding: 20,
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
      fontSize: 30,
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
      paddingHorizontal: 16,
      borderRadius: 10,
    },

    textoNovo: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },

    totalCard: {
      backgroundColor:
        '#222222',
      borderRadius: 13,
      padding: 18,
      marginBottom: 18,
    },

    totalLabel: {
      color: '#FFFFFF',
      fontSize: 13,
      marginBottom: 5,
    },

    totalValor: {
      color: '#FFFFFF',
      fontSize: 27,
      fontWeight: 'bold',
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

    categoria: {
      fontSize: 13,
      marginTop: 4,
    },

    valor: {
      fontSize: 18,
      fontWeight: 'bold',
    },

    data: {
      fontSize: 13,
      marginTop: 12,
    },

    veiculo: {
      fontSize: 13,
      marginTop: 4,
    },

    observacao: {
      fontSize: 13,
      marginTop: 8,
      lineHeight: 18,
    },

    acoes: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },

    botaoEditar: {
      flex: 1,
      padding: 11,
      borderRadius: 8,
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      alignItems: 'center',
    },

    botaoExcluir: {
      flex: 1,
      padding: 11,
      borderRadius: 8,
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      alignItems: 'center',
    },

    textoEditar: {
      fontWeight: '600',
    },

    textoExcluir: {
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
      lineHeight: 20,
    },
  });