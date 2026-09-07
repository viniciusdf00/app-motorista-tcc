import {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { supabase } from '../../services/supabase';

export default function ActiveJourneyScreen({
  route,
  navigation,
}) {
  const { jornadaId } =
    route.params;

  const [jornada, setJornada] =
    useState(null);

  const [veiculo, setVeiculo] =
    useState(null);

  const [plataformas, setPlataformas] =
    useState([]);

  const [tempo, setTempo] =
    useState('00:00:00');

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    carregarJornada();
  }, []);

  useEffect(() => {
    if (!jornada?.inicio) {
      return;
    }

    atualizarTempo();

    const intervalo = setInterval(
      atualizarTempo,
      1000
    );

    return () =>
      clearInterval(intervalo);
  }, [jornada]);

  function atualizarTempo() {
    if (!jornada?.inicio) {
      return;
    }

    const inicio = new Date(
      jornada.inicio
    );

    const agora = new Date();

    const diferenca = Math.max(
      0,
      Math.floor(
        (agora - inicio) / 1000
      )
    );

    const horas = Math.floor(
      diferenca / 3600
    );

    const minutos = Math.floor(
      (diferenca % 3600) / 60
    );

    const segundos =
      diferenca % 60;

    const formatar = (numero) =>
      String(numero).padStart(
        2,
        '0'
      );

    setTempo(
      `${formatar(
        horas
      )}:${formatar(
        minutos
      )}:${formatar(segundos)}`
    );
  }

  async function carregarJornada() {
    try {
      setCarregando(true);

      const {
        data: dadosJornada,
        error: erroJornada,
      } = await supabase
        .from('jornadas')
        .select(
          'id, veiculo_id, inicio, km_inicial, status'
        )
        .eq('id', jornadaId)
        .single();

      if (erroJornada) {
        console.log(
          'Erro ao carregar jornada:',
          erroJornada
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar a jornada.'
        );

        return;
      }

      setJornada(dadosJornada);

      const {
        data: dadosVeiculo,
        error: erroVeiculo,
      } = await supabase
        .from('veiculos')
        .select(
          'marca, modelo, placa'
        )
        .eq(
          'id',
          dadosJornada.veiculo_id
        )
        .single();

      if (!erroVeiculo) {
        setVeiculo(dadosVeiculo);
      }

      const {
        data: vinculos,
        error: erroVinculos,
      } = await supabase
        .from('jornada_plataforma')
        .select('plataforma_id')
        .eq(
          'jornada_id',
          jornadaId
        );

      if (
        !erroVinculos &&
        vinculos &&
        vinculos.length > 0
      ) {
        const ids = vinculos.map(
          (item) =>
            item.plataforma_id
        );

        const {
          data: dadosPlataformas,
        } = await supabase
          .from('plataformas')
          .select('id, nome')
          .in('id', ids);

        setPlataformas(
          dadosPlataformas || []
        );
      }
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao carregar a jornada.'
      );
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator
          size="large"
        />

        <Text style={styles.carregando}>
          Carregando jornada...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        ● JORNADA EM ANDAMENTO
      </Text>

      <Text style={styles.titulo}>
        Tempo de trabalho
      </Text>

      <Text style={styles.tempo}>
        {tempo}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          Veículo
        </Text>

        <Text style={styles.cardValor}>
          {veiculo
            ? `${veiculo.marca} ${veiculo.modelo}`
            : 'Não informado'}
        </Text>

        {veiculo?.placa && (
          <Text style={styles.detalhe}>
            {veiculo.placa}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          Quilometragem inicial
        </Text>

        <Text style={styles.cardValor}>
          {jornada?.km_inicial} km
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          Plataformas
        </Text>

        <Text style={styles.cardValor}>
          {plataformas.length > 0
            ? plataformas
                .map(
                  (plataforma) =>
                    plataforma.nome
                )
                .join(', ')
            : 'Não informado'}
        </Text>
      </View>

      <Text style={styles.aviso}>
        A jornada continuará em
        andamento mesmo se você voltar
        para a tela inicial.
      </Text>

      <TouchableOpacity
        style={styles.botaoVoltar}
        onPress={() =>
          navigation.navigate('Home')
        }
      >
        <Text style={styles.textoVoltar}>
          Voltar para a Home
        </Text>
      </TouchableOpacity>

      <View style={styles.proximaEtapa}>
        <Text style={styles.proximaTitulo}>
          Finalizar jornada
        </Text>

        <Text style={styles.proximaTexto}>
          Na próxima etapa vamos
          registrar km final, quantidade
          de corridas e valor recebido.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F5F6F8',
  },

  centralizado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
  },

  carregando: {
    marginTop: 12,
  },

  status: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  titulo: {
    fontSize: 20,
    textAlign: 'center',
  },

  tempo: {
    fontSize: 46,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 17,
    marginBottom: 12,
  },

  cardLabel: {
    fontSize: 13,
    marginBottom: 5,
  },

  cardValor: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  detalhe: {
    fontSize: 13,
    marginTop: 4,
  },

  aviso: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    textAlign: 'center',
  },

  botaoVoltar: {
    backgroundColor: '#222222',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },

  textoVoltar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  proximaEtapa: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },

  proximaTitulo: {
    fontWeight: 'bold',
    marginBottom: 5,
  },

  proximaTexto: {
    fontSize: 13,
    lineHeight: 18,
  },
});