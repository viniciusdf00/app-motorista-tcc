import { useEffect, useState } from 'react';

import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { supabase } from '../../services/supabase';

export default function JourneySummaryScreen({
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

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    carregarResumo();
  }, []);

  async function carregarResumo() {
    try {
      setCarregando(true);

      const {
        data: dadosJornada,
        error: erroJornada,
      } = await supabase
        .from('jornadas')
        .select(
          `
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
          `
        )
        .eq('id', jornadaId)
        .single();

      if (erroJornada) {
        console.log(
          'Erro ao carregar resumo:',
          erroJornada
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar o resumo da jornada.'
        );

        return;
      }

      setJornada(dadosJornada);

      const {
        data: dadosVeiculo,
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

      setVeiculo(
        dadosVeiculo || null
      );

      const {
        data: vinculos,
      } = await supabase
        .from('jornada_plataforma')
        .select('plataforma_id')
        .eq(
          'jornada_id',
          jornadaId
        );

      if (
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
        'Ocorreu um problema ao carregar o resumo.'
      );
    } finally {
      setCarregando(false);
    }
  }

  function calcularDuracaoSegundos() {
    if (
      !jornada?.inicio ||
      !jornada?.fim
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.floor(
        (
          new Date(jornada.fim) -
          new Date(jornada.inicio)
        ) / 1000
      )
    );
  }

  function formatarDuracao() {
    const segundosTotais =
      calcularDuracaoSegundos();

    const horas = Math.floor(
      segundosTotais / 3600
    );

    const minutos = Math.floor(
      (segundosTotais % 3600) / 60
    );

    const segundos =
      segundosTotais % 60;

    const formatar = (numero) =>
      String(numero).padStart(
        2,
        '0'
      );

    return `${formatar(
      horas
    )}:${formatar(
      minutos
    )}:${formatar(segundos)}`;
  }

  function calcularKm() {
    if (
      jornada?.km_final === null ||
      jornada?.km_final === undefined
    ) {
      return 0;
    }

    return (
      jornada.km_final -
      jornada.km_inicial
    );
  }

  function calcularValorHora() {
    const segundos =
      calcularDuracaoSegundos();

    if (segundos <= 0) {
      return 0;
    }

    const horas =
      segundos / 3600;

    return (
      Number(
        jornada?.valor_recebido || 0
      ) / horas
    );
  }

  function calcularValorKm() {
    const km = calcularKm();

    if (km <= 0) {
      return 0;
    }

    return (
      Number(
        jornada?.valor_recebido || 0
      ) / km
    );
  }

  function formatarDinheiro(valor) {
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
    ).toLocaleString('pt-BR');
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator
          size="large"
        />

        <Text style={styles.carregando}>
          Calculando resumo...
        </Text>
      </View>
    );
  }

  const kmPercorridos =
    calcularKm();

  const valorHora =
    calcularValorHora();

  const valorKm =
    calcularValorKm();

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >
      <Text style={styles.status}>
        ✓ JORNADA FINALIZADA
      </Text>

      <Text style={styles.titulo}>
        Resumo da jornada
      </Text>

      <Text style={styles.subtitulo}>
        Confira os principais dados
        do seu período de trabalho.
      </Text>

      <View style={styles.destaque}>
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
            jornada?.valor_recebido ||
              0
          )}
        </Text>
      </View>

      <View style={styles.grade}>
        <View style={styles.cardMetade}>
          <Text style={styles.cardLabel}>
            Tempo
          </Text>

          <Text style={styles.cardValor}>
            {formatarDuracao()}
          </Text>
        </View>

        <View style={styles.cardMetade}>
          <Text style={styles.cardLabel}>
            Distância
          </Text>

          <Text style={styles.cardValor}>
            {kmPercorridos} km
          </Text>
        </View>

        <View style={styles.cardMetade}>
          <Text style={styles.cardLabel}>
            R$/hora
          </Text>

          <Text style={styles.cardValor}>
            {formatarDinheiro(
              valorHora
            )}
          </Text>
        </View>

        <View style={styles.cardMetade}>
          <Text style={styles.cardLabel}>
            R$/km
          </Text>

          <Text style={styles.cardValor}>
            {formatarDinheiro(
              valorKm
            )}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          Corridas realizadas
        </Text>

        <Text style={styles.cardValor}>
          {jornada?.quantidade_corridas ??
            0}
        </Text>
      </View>

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

      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          Início
        </Text>

        <Text style={styles.cardTexto}>
          {formatarData(
            jornada?.inicio
          )}
        </Text>

        <Text
          style={[
            styles.cardLabel,
            styles.espaco,
          ]}
        >
          Fim
        </Text>

        <Text style={styles.cardTexto}>
          {formatarData(
            jornada?.fim
          )}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          Quilometragem
        </Text>

        <Text style={styles.cardTexto}>
          Inicial: {jornada?.km_inicial} km
        </Text>

        <Text style={styles.cardTexto}>
          Final: {jornada?.km_final} km
        </Text>
      </View>

      {jornada?.observacao && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Observação
          </Text>

          <Text style={styles.cardTexto}>
            {jornada.observacao}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.botao}
        onPress={() =>
          navigation.navigate('Home')
        }
      >
        <Text style={styles.textoBotao}>
          Voltar para a Home
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
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
    marginBottom: 12,
  },

  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  subtitulo: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 22,
  },

  destaque: {
    backgroundColor: '#222222',
    borderRadius: 14,
    padding: 22,
    marginBottom: 14,
  },

  destaqueLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 5,
  },

  destaqueValor: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
  },

  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
  },

  cardMetade: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
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

  cardTexto: {
    fontSize: 15,
    lineHeight: 21,
  },

  detalhe: {
    fontSize: 13,
    marginTop: 4,
  },

  espaco: {
    marginTop: 13,
  },

  botao: {
    backgroundColor: '#222222',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },

  textoBotao: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});