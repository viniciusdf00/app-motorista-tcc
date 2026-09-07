import { useCallback, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../../services/supabase';

export default function VehiclesScreen({ navigation }) {
  const [veiculos, setVeiculos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarVeiculos() {
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

      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('criado_em', {
          ascending: false,
        });

      if (error) {
        console.log(
          'Erro ao consultar veículos:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar seus veículos.'
        );

        return;
      }

      setVeiculos(data || []);
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao consultar os veículos.'
      );
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarVeiculos();
    }, [])
  );

  function confirmarExclusao(veiculo) {
    Alert.alert(
      'Excluir veículo',
      `Deseja excluir ${veiculo.marca} ${veiculo.modelo}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirVeiculo(veiculo.id),
        },
      ]
    );
  }

  async function excluirVeiculo(veiculoId) {
    try {
      const { error } = await supabase
        .from('veiculos')
        .update({
          ativo: false,
        })
        .eq('id', veiculoId);

      if (error) {
        console.log(
          'Erro ao excluir veículo:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível excluir o veículo.'
        );

        return;
      }

      Alert.alert(
        'Veículo excluído',
        'O veículo foi removido da sua lista.'
      );

      carregarVeiculos();
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao excluir o veículo.'
      );
    }
  }

  function renderizarVeiculo({ item }) {
    return (
      <View style={styles.card}>
        <Text style={styles.modelo}>
          {item.marca} {item.modelo}
        </Text>

        <Text style={styles.informacao}>
          Ano: {item.ano || 'Não informado'}
        </Text>

        <Text style={styles.informacao}>
          Placa: {item.placa || 'Não informada'}
        </Text>

        <Text style={styles.informacao}>
          Combustível: {item.tipo_combustivel}
        </Text>

        <Text style={styles.informacao}>
          Quilometragem: {item.quilometragem_atual ?? 0} km
        </Text>

        <View style={styles.acoes}>
          <TouchableOpacity
            style={styles.botaoEditar}
            onPress={() =>
              navigation.navigate(
                'EditarVeiculo',
                {
                  veiculo: item,
                }
              )
            }
          >
            <Text style={styles.textoEditar}>
              Editar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoExcluir}
            onPress={() =>
              confirmarExclusao(item)
            }
          >
            <Text style={styles.textoExcluir}>
              Excluir
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" />

        <Text style={styles.textoCarregando}>
          Carregando veículos...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>
          Meus veículos
        </Text>

        <Text style={styles.subtitulo}>
          Consulte e gerencie os veículos cadastrados.
        </Text>
      </View>

      <FlatList
        data={veiculos}
        keyExtractor={(item) => item.id}
        renderItem={renderizarVeiculo}
        contentContainerStyle={
          veiculos.length === 0
            ? styles.listaVazia
            : styles.lista
        }
        ListEmptyComponent={
          <View style={styles.centralizado}>
            <Text style={styles.vazioTitulo}>
              Nenhum veículo cadastrado
            </Text>

            <Text style={styles.vazioTexto}>
              Cadastre um veículo para começar.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.botaoNovo}
        onPress={() =>
          navigation.navigate(
            'CadastroVeiculo'
          )
        }
      >
        <Text style={styles.textoBotaoNovo}>
          + Novo veículo
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    padding: 20,
  },

  cabecalho: {
    marginBottom: 15,
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  subtitulo: {
    fontSize: 15,
  },

  lista: {
    paddingBottom: 100,
  },

  listaVazia: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },

  modelo: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  informacao: {
    fontSize: 14,
    marginBottom: 5,
  },

  acoes: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },

  botaoEditar: {
    flex: 1,
    backgroundColor: '#222222',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  textoEditar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  botaoExcluir: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#BBBBBB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  textoExcluir: {
    fontWeight: 'bold',
  },

  botaoNovo: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    backgroundColor: '#222222',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },

  textoBotaoNovo: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  centralizado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  textoCarregando: {
    marginTop: 10,
  },

  vazioTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  vazioTexto: {
    fontSize: 14,
  },
});