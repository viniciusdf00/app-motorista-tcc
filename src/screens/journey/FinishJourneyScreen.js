import { useEffect, useState } from 'react';

import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';

import { supabase } from '../../services/supabase';

export default function FinishJourneyScreen({
  route,
  navigation,
}) {
  const { jornadaId } = route.params;

  const [jornada, setJornada] =
    useState(null);

  const [kmFinal, setKmFinal] =
    useState('');

  const [
    quantidadeCorridas,
    setQuantidadeCorridas,
  ] = useState('');

  const [
    valorRecebido,
    setValorRecebido,
  ] = useState('');

  const [
    observacao,
    setObservacao,
  ] = useState('');

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  useEffect(() => {
    carregarJornada();
  }, []);

  /*
   * Depois que a jornada for finalizada,
   * remove da pilha as telas antigas:
   *
   * JornadaAtiva
   * FinalizarJornada
   *
   * E deixa somente:
   *
   * Home
   * ↓
   * ResumoJornada
   *
   * Assim, ao apertar a seta de voltar
   * no resumo, o usuário retorna
   * diretamente para a Home.
   */
  function abrirResumoAposFinalizar() {
    navigation.reset({
      index: 1,
      routes: [
        {
          name: 'Home',
        },
        {
          name: 'ResumoJornada',
          params: {
            jornadaId,
          },
        },
      ],
    });
  }

  async function carregarJornada() {
    try {
      setCarregando(true);

      const {
        data,
        error,
      } = await supabase
        .from('jornadas')
        .select(
          'id, veiculo_id, km_inicial, inicio, status'
        )
        .eq(
          'id',
          jornadaId
        )
        .single();

      if (error) {
        console.log(
          'Erro ao carregar jornada:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar a jornada.'
        );

        return;
      }

      /*
       * Caso essa tela seja aberta
       * para uma jornada que já foi
       * finalizada, não mostra mais
       * o formulário.
       */
      if (
        data.status !==
        'em_andamento'
      ) {
        abrirResumoAposFinalizar();

        return;
      }

      setJornada(data);

      setKmFinal(
        String(
          data.km_inicial
        )
      );
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

  async function finalizarJornada() {
    /*
     * Quilometragem final
     */
    if (!kmFinal.trim()) {
      Alert.alert(
        'Quilometragem obrigatória',
        'Informe a quilometragem final.'
      );

      return;
    }

    /*
     * Quantidade de corridas
     */
    if (
      !quantidadeCorridas.trim()
    ) {
      Alert.alert(
        'Quantidade obrigatória',
        'Informe a quantidade de corridas realizadas.'
      );

      return;
    }

    /*
     * Valor recebido
     */
    if (
      !valorRecebido.trim()
    ) {
      Alert.alert(
        'Valor obrigatório',
        'Informe o valor recebido durante a jornada.'
      );

      return;
    }

    const kmFinalNumero =
      Number(kmFinal);

    const corridasNumero =
      Number(
        quantidadeCorridas
      );

    const valorNumero =
      Number(
        valorRecebido.replace(
          ',',
          '.'
        )
      );

    /*
     * Validação da quilometragem.
     */
    if (
      !Number.isInteger(
        kmFinalNumero
      ) ||
      kmFinalNumero <
        jornada.km_inicial
    ) {
      Alert.alert(
        'Quilometragem inválida',
        `A quilometragem final não pode ser menor que ${jornada.km_inicial} km.`
      );

      return;
    }

    /*
     * Validação das corridas.
     */
    if (
      !Number.isInteger(
        corridasNumero
      ) ||
      corridasNumero < 0
    ) {
      Alert.alert(
        'Quantidade inválida',
        'Informe uma quantidade válida de corridas.'
      );

      return;
    }

    /*
     * Validação do valor.
     */
    if (
      !Number.isFinite(
        valorNumero
      ) ||
      valorNumero < 0
    ) {
      Alert.alert(
        'Valor inválido',
        'Informe um valor recebido válido.'
      );

      return;
    }

    try {
      setSalvando(true);

      const fim =
        new Date().toISOString();

      /*
       * Finaliza a jornada.
       */
      const {
        error: erroJornada,
      } = await supabase
        .from('jornadas')
        .update({
          fim,

          km_final:
            kmFinalNumero,

          quantidade_corridas:
            corridasNumero,

          valor_recebido:
            valorNumero,

          observacao:
            observacao.trim()
              ? observacao.trim()
              : null,

          status:
            'finalizada',
        })
        .eq(
          'id',
          jornadaId
        );

      if (erroJornada) {
        console.log(
          'Erro ao finalizar jornada:',
          erroJornada
        );

        Alert.alert(
          'Erro',
          'Não foi possível finalizar a jornada.'
        );

        return;
      }

      /*
       * Atualiza a quilometragem
       * atual do veículo.
       */
      const {
        error: erroVeiculo,
      } = await supabase
        .from('veiculos')
        .update({
          quilometragem_atual:
            kmFinalNumero,
        })
        .eq(
          'id',
          jornada.veiculo_id
        );

      if (erroVeiculo) {
        console.log(
          'Erro ao atualizar veículo:',
          erroVeiculo
        );

        Alert.alert(
          'Atenção',
          'A jornada foi finalizada, mas não foi possível atualizar a quilometragem do veículo.'
        );
      }

      /*
       * IMPORTANTE:
       *
       * Aqui não usamos mais:
       *
       * navigation.replace(...)
       *
       * Agora limpamos a pilha
       * das telas da jornada.
       */
      abrirResumoAposFinalizar();
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao finalizar a jornada.'
      );
    } finally {
      setSalvando(false);
    }
  }

  function confirmarFinalizacao() {
    Alert.alert(
      'Finalizar jornada',
      'Confirma o encerramento desta jornada?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Finalizar',
          onPress:
            finalizarJornada,
        },
      ]
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
          Carregando jornada...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={
          styles.titulo
        }
      >
        Finalizar jornada
      </Text>

      <Text
        style={
          styles.subtitulo
        }
      >
        Informe os dados do encerramento
        do seu período de trabalho.
      </Text>

      <View
        style={
          styles.informacao
        }
      >
        <Text
          style={
            styles.infoLabel
          }
        >
          Quilometragem inicial
        </Text>

        <Text
          style={
            styles.infoValor
          }
        >
          {jornada?.km_inicial} km
        </Text>
      </View>

      <Text
        style={
          styles.label
        }
      >
        Quilometragem final
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="Ex.: 65280"
        keyboardType="numeric"
        value={kmFinal}
        onChangeText={
          setKmFinal
        }
      />

      <Text
        style={
          styles.label
        }
      >
        Quantidade de corridas
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="Ex.: 12"
        keyboardType="numeric"
        value={
          quantidadeCorridas
        }
        onChangeText={
          setQuantidadeCorridas
        }
      />

      <Text
        style={
          styles.label
        }
      >
        Valor recebido
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="Ex.: 185,50"
        keyboardType="decimal-pad"
        value={
          valorRecebido
        }
        onChangeText={
          setValorRecebido
        }
      />

      <Text
        style={
          styles.label
        }
      >
        Observação
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.textArea,
        ]}
        placeholder="Opcional"
        multiline
        value={
          observacao
        }
        onChangeText={
          setObservacao
        }
      />

      <TouchableOpacity
        style={[
          styles.botaoFinalizar,
          salvando &&
            styles.botaoDesabilitado,
        ]}
        disabled={
          salvando
        }
        onPress={
          confirmarFinalizacao
        }
      >
        <Text
          style={
            styles.textoBotao
          }
        >
          {salvando
            ? 'Finalizando...'
            : 'Finalizar jornada'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 24,
      paddingBottom: 40,
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

    titulo: {
      fontSize: 30,
      fontWeight: 'bold',
      marginBottom: 7,
    },

    subtitulo: {
      fontSize: 15,
      lineHeight: 21,
      marginBottom: 25,
    },

    informacao: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDDDDD',
      borderRadius: 10,
      padding: 15,
      marginBottom: 10,
    },

    infoLabel: {
      fontSize: 13,
      marginBottom: 4,
    },

    infoValor: {
      fontSize: 19,
      fontWeight: 'bold',
    },

    label: {
      fontSize: 15,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 6,
    },

    input: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
    },

    textArea: {
      minHeight: 100,
      textAlignVertical:
        'top',
    },

    botaoFinalizar: {
      backgroundColor:
        '#222222',
      padding: 17,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 32,
    },

    botaoDesabilitado: {
      opacity: 0.6,
    },

    textoBotao: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });