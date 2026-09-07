import { useEffect, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { supabase } from '../../services/supabase';

export default function StartJourneyScreen({
  navigation,
}) {
  const [usuarioId, setUsuarioId] = useState(null);

  const [veiculos, setVeiculos] = useState([]);
  const [plataformas, setPlataformas] = useState([]);

  const [veiculoSelecionado, setVeiculoSelecionado] =
    useState(null);

  const [
    plataformasSelecionadas,
    setPlataformasSelecionadas,
  ] = useState([]);

  const [kmInicial, setKmInicial] = useState('');

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
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

      setUsuarioId(user.id);

      // Verifica se já existe uma jornada em andamento
      const {
        data: jornadasAtivas,
        error: erroJornada,
      } = await supabase
        .from('jornadas')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('status', 'em_andamento')
        .limit(1);

      if (erroJornada) {
        console.log(
          'Erro ao verificar jornada:',
          erroJornada
        );

        Alert.alert(
          'Erro',
          'Não foi possível verificar suas jornadas.'
        );

        return;
      }

      if (
        jornadasAtivas &&
        jornadasAtivas.length > 0
      ) {
        navigation.replace(
          'JornadaAtiva',
          {
            jornadaId:
              jornadasAtivas[0].id,
          }
        );

        return;
      }

      const {
        data: dadosVeiculos,
        error: erroVeiculos,
      } = await supabase
        .from('veiculos')
        .select(
          'id, marca, modelo, ano, placa, quilometragem_atual'
        )
        .eq('usuario_id', user.id)
        .eq('ativo', true)
        .order('criado_em', {
          ascending: true,
        });

      if (erroVeiculos) {
        console.log(
          'Erro ao carregar veículos:',
          erroVeiculos
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar seus veículos.'
        );

        return;
      }

      const {
        data: dadosPlataformas,
        error: erroPlataformas,
      } = await supabase
        .from('plataformas')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (erroPlataformas) {
        console.log(
          'Erro ao carregar plataformas:',
          erroPlataformas
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar as plataformas.'
        );

        return;
      }

      setVeiculos(dadosVeiculos || []);
      setPlataformas(
        dadosPlataformas || []
      );

      // Se existir somente um veículo,
      // já deixa ele selecionado.
      if (
        dadosVeiculos &&
        dadosVeiculos.length === 1
      ) {
        selecionarVeiculo(
          dadosVeiculos[0]
        );
      }
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao carregar os dados.'
      );
    } finally {
      setCarregando(false);
    }
  }

  function selecionarVeiculo(veiculo) {
    setVeiculoSelecionado(veiculo.id);

    if (
      veiculo.quilometragem_atual !== null
    ) {
      setKmInicial(
        String(
          veiculo.quilometragem_atual
        )
      );
    }
  }

  function selecionarPlataforma(
    plataformaId
  ) {
    if (
      plataformasSelecionadas.includes(
        plataformaId
      )
    ) {
      setPlataformasSelecionadas(
        plataformasSelecionadas.filter(
          (id) => id !== plataformaId
        )
      );
    } else {
      setPlataformasSelecionadas([
        ...plataformasSelecionadas,
        plataformaId,
      ]);
    }
  }

  async function iniciarJornada() {
    if (!veiculoSelecionado) {
      Alert.alert(
        'Veículo obrigatório',
        'Selecione o veículo que será utilizado.'
      );

      return;
    }

    if (
      plataformasSelecionadas.length ===
      0
    ) {
      Alert.alert(
        'Plataforma obrigatória',
        'Selecione pelo menos uma plataforma.'
      );

      return;
    }

    if (!kmInicial.trim()) {
      Alert.alert(
        'Quilometragem obrigatória',
        'Informe a quilometragem inicial.'
      );

      return;
    }

    const kmNumero =
      Number(kmInicial);

    if (
      !Number.isInteger(kmNumero) ||
      kmNumero < 0
    ) {
      Alert.alert(
        'Quilometragem inválida',
        'Informe uma quilometragem válida.'
      );

      return;
    }

    try {
      setSalvando(true);

      /*
       * Verificamos novamente antes do INSERT
       * para evitar duas jornadas simultâneas.
       */
      const {
        data: jornadaExistente,
        error: erroVerificacao,
      } = await supabase
        .from('jornadas')
        .select('id')
        .eq('usuario_id', usuarioId)
        .eq('status', 'em_andamento')
        .limit(1);

      if (erroVerificacao) {
        Alert.alert(
          'Erro',
          'Não foi possível verificar a jornada.'
        );

        return;
      }

      if (
        jornadaExistente &&
        jornadaExistente.length > 0
      ) {
        navigation.replace(
          'JornadaAtiva',
          {
            jornadaId:
              jornadaExistente[0].id,
          }
        );

        return;
      }

      // Cria a jornada
      const {
        data: jornada,
        error: erroJornada,
      } = await supabase
        .from('jornadas')
        .insert({
          usuario_id: usuarioId,
          veiculo_id:
            veiculoSelecionado,
          km_inicial: kmNumero,
          status: 'em_andamento',
        })
        .select('id')
        .single();

      if (erroJornada) {
        console.log(
          'Erro ao criar jornada:',
          erroJornada
        );

        Alert.alert(
          'Erro',
          'Não foi possível iniciar a jornada.'
        );

        return;
      }

      // Cria os relacionamentos
      // Jornada x Plataforma
      const relacionamentos =
        plataformasSelecionadas.map(
          (plataformaId) => ({
            jornada_id: jornada.id,
            plataforma_id:
              plataformaId,
          })
        );

      const {
        error:
          erroRelacionamento,
      } = await supabase
        .from('jornada_plataforma')
        .insert(relacionamentos);

      if (erroRelacionamento) {
        console.log(
          'Erro ao vincular plataformas:',
          erroRelacionamento
        );

        /*
         * Como não conseguimos criar
         * os vínculos, removemos a jornada
         * recém-criada para não deixar
         * um registro incompleto.
         */
        await supabase
          .from('jornadas')
          .delete()
          .eq('id', jornada.id);

        Alert.alert(
          'Erro',
          'Não foi possível vincular as plataformas à jornada.'
        );

        return;
      }

      navigation.replace(
        'JornadaAtiva',
        {
          jornadaId: jornada.id,
        }
      );
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao iniciar a jornada.'
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator
          size="large"
        />

        <Text style={styles.carregando}>
          Preparando sua jornada...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >
      <Text style={styles.titulo}>
        Iniciar jornada
      </Text>

      <Text style={styles.subtitulo}>
        Informe como você vai começar
        seu período de trabalho.
      </Text>

      <Text style={styles.secao}>
        Veículo
      </Text>

      {veiculos.length === 0 ? (
        <View style={styles.aviso}>
          <Text>
            Nenhum veículo ativo foi
            encontrado.
          </Text>
        </View>
      ) : (
        veiculos.map((veiculo) => {
          const selecionado =
            veiculoSelecionado ===
            veiculo.id;

          return (
            <TouchableOpacity
              key={veiculo.id}
              style={[
                styles.card,
                selecionado &&
                  styles.cardSelecionado,
              ]}
              onPress={() =>
                selecionarVeiculo(
                  veiculo
                )
              }
            >
              <Text
                style={[
                  styles.cardTitulo,
                  selecionado &&
                    styles.textoSelecionado,
                ]}
              >
                {veiculo.marca}{' '}
                {veiculo.modelo}
              </Text>

              <Text
                style={[
                  styles.cardTexto,
                  selecionado &&
                    styles.textoSelecionado,
                ]}
              >
                {veiculo.ano || ''}
                {veiculo.placa
                  ? ` • ${veiculo.placa}`
                  : ''}
              </Text>

              <Text
                style={[
                  styles.cardTexto,
                  selecionado &&
                    styles.textoSelecionado,
                ]}
              >
                {veiculo.quilometragem_atual ??
                  0}{' '}
                km
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      <Text style={styles.secao}>
        Plataformas
      </Text>

      <Text style={styles.ajuda}>
        Você pode selecionar mais de
        uma.
      </Text>

      <View style={styles.plataformas}>
        {plataformas.map(
          (plataforma) => {
            const selecionada =
              plataformasSelecionadas.includes(
                plataforma.id
              );

            return (
              <TouchableOpacity
                key={plataforma.id}
                style={[
                  styles.plataforma,
                  selecionada &&
                    styles.plataformaSelecionada,
                ]}
                onPress={() =>
                  selecionarPlataforma(
                    plataforma.id
                  )
                }
              >
                <Text
                  style={[
                    styles.textoPlataforma,
                    selecionada &&
                      styles.textoSelecionado,
                  ]}
                >
                  {plataforma.nome}
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </View>

      <Text style={styles.secao}>
        Quilometragem inicial
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ex.: 65100"
        keyboardType="numeric"
        value={kmInicial}
        onChangeText={setKmInicial}
      />

      <TouchableOpacity
        style={[
          styles.botao,
          salvando &&
            styles.botaoDesabilitado,
        ]}
        onPress={iniciarJornada}
        disabled={salvando}
      >
        <Text style={styles.textoBotao}>
          {salvando
            ? 'Iniciando...'
            : 'Iniciar jornada'}
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

  secao: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 10,
  },

  ajuda: {
    fontSize: 13,
    marginTop: -5,
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },

  cardSelecionado: {
    backgroundColor: '#222222',
    borderColor: '#222222',
  },

  cardTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  cardTexto: {
    fontSize: 14,
    marginBottom: 3,
  },

  textoSelecionado: {
    color: '#FFFFFF',
  },

  plataformas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  plataforma: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 18,
  },

  plataformaSelecionada: {
    backgroundColor: '#222222',
    borderColor: '#222222',
  },

  textoPlataforma: {
    fontSize: 15,
    fontWeight: '600',
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },

  aviso: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
  },

  botao: {
    backgroundColor: '#222222',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 35,
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