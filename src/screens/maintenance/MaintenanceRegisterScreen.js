import {
  useEffect,
  useState,
} from 'react';

import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { supabase } from '../../services/supabase';

export default function MaintenanceRegisterScreen({
  navigation,
}) {
  const [
    veiculos,
    setVeiculos,
  ] = useState([]);

  const [
    tipos,
    setTipos,
  ] = useState([]);

  const [
    veiculoSelecionado,
    setVeiculoSelecionado,
  ] = useState(null);

  const [
    tipoSelecionado,
    setTipoSelecionado,
  ] = useState(null);

  const [
    descricao,
    setDescricao,
  ] = useState('');

  const [
    valor,
    setValor,
  ] = useState('');

  const [
    quilometragem,
    setQuilometragem,
  ] = useState('');

  const [
    dataManutencao,
    setDataManutencao,
  ] = useState(
    dataHoje()
  );

  const [
    proximaData,
    setProximaData,
  ] = useState('');

  const [
    proximaKm,
    setProximaKm,
  ] = useState('');

  const [
    oficina,
    setOficina,
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
    carregarDados();
  }, []);

  function dataHoje() {
    const hoje =
      new Date();

    const dia =
      String(
        hoje.getDate()
      ).padStart(2, '0');

    const mes =
      String(
        hoje.getMonth() + 1
      ).padStart(2, '0');

    return `${dia}/${mes}/${hoje.getFullYear()}`;
  }

  function formatarEntradaData(
    texto
  ) {
    const numeros =
      texto
        .replace(/\D/g, '')
        .slice(0, 8);

    if (
      numeros.length <= 2
    ) {
      return numeros;
    }

    if (
      numeros.length <= 4
    ) {
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

  function converterData(
    texto
  ) {
    if (
      !/^\d{2}\/\d{2}\/\d{4}$/.test(
        texto
      )
    ) {
      return null;
    }

    const [
      diaTexto,
      mesTexto,
      anoTexto,
    ] = texto.split('/');

    const dia =
      Number(diaTexto);

    const mes =
      Number(mesTexto);

    const ano =
      Number(anoTexto);

    const dataObj =
      new Date(
        ano,
        mes - 1,
        dia
      );

    if (
      dataObj.getFullYear() !==
        ano ||
      dataObj.getMonth() !==
        mes - 1 ||
      dataObj.getDate() !==
        dia
    ) {
      return null;
    }

    return {
      dataObj,
      banco: `${ano}-${String(
        mes
      ).padStart(
        2,
        '0'
      )}-${String(
        dia
      ).padStart(
        2,
        '0'
      )}`,
    };
  }

  async function carregarDados() {
    try {
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
        data: dadosVeiculos,
      } = await supabase
        .from('veiculos')
        .select(`
          id,
          marca,
          modelo,
          placa,
          quilometragem_atual
        `)
        .eq(
          'usuario_id',
          user.id
        )
        .eq(
          'ativo',
          true
        )
        .order('marca');

      const {
        data: dadosTipos,
      } = await supabase
        .from('tipos_manutencao')
        .select('id, nome')
        .eq(
          'ativo',
          true
        )
        .order('nome');

      const listaVeiculos =
        dadosVeiculos || [];

      setVeiculos(
        listaVeiculos
      );

      setTipos(
        dadosTipos || []
      );

      if (
        listaVeiculos.length ===
        1
      ) {
        selecionarVeiculo(
          listaVeiculos[0]
        );
      }
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Não foi possível carregar os dados.'
      );
    } finally {
      setCarregando(false);
    }
  }

  function selecionarVeiculo(
    veiculo
  ) {
    setVeiculoSelecionado(
      veiculo.id
    );

    if (
      veiculo.quilometragem_atual !==
        null &&
      veiculo.quilometragem_atual !==
        undefined
    ) {
      setQuilometragem(
        String(
          veiculo.quilometragem_atual
        )
      );
    }
  }

  async function salvar() {
    if (
      !veiculoSelecionado
    ) {
      Alert.alert(
        'Veículo obrigatório',
        'Selecione um veículo.'
      );

      return;
    }

    if (
      !tipoSelecionado
    ) {
      Alert.alert(
        'Tipo obrigatório',
        'Selecione o tipo da manutenção.'
      );

      return;
    }

    if (
      !descricao.trim()
    ) {
      Alert.alert(
        'Descrição obrigatória',
        'Informe a descrição da manutenção.'
      );

      return;
    }

    let valorNumero =
      null;

    if (
      valor.trim()
    ) {
      valorNumero =
        Number(
          valor.replace(
            ',',
            '.'
          )
        );

      if (
        !Number.isFinite(
          valorNumero
        ) ||
        valorNumero < 0
      ) {
        Alert.alert(
          'Valor inválido',
          'Informe um valor válido.'
        );

        return;
      }
    }

    let kmNumero =
      null;

    if (
      quilometragem.trim()
    ) {
      kmNumero =
        Number(
          quilometragem
        );

      if (
        !Number.isInteger(
          kmNumero
        ) ||
        kmNumero < 0
      ) {
        Alert.alert(
          'Quilometragem inválida',
          'Informe uma quilometragem válida.'
        );

        return;
      }
    }

    const manutencaoConvertida =
      converterData(
        dataManutencao
      );

    if (
      !manutencaoConvertida
    ) {
      Alert.alert(
        'Data inválida',
        'Informe uma data de manutenção válida no formato DD/MM/AAAA.'
      );

      return;
    }

    const hoje =
      new Date();

    hoje.setHours(
      0,
      0,
      0,
      0
    );

    if (
      manutencaoConvertida.dataObj >
      hoje
    ) {
      Alert.alert(
        'Data futura',
        'A data da manutenção não pode ser posterior à data de hoje.'
      );

      return;
    }

    let proximaDataBanco =
      null;

    if (
      proximaData.trim()
    ) {
      const proximaConvertida =
        converterData(
          proximaData
        );

      if (
        !proximaConvertida
      ) {
        Alert.alert(
          'Próxima data inválida',
          'Informe uma próxima data válida no formato DD/MM/AAAA.'
        );

        return;
      }

      if (
        proximaConvertida.dataObj <
        manutencaoConvertida.dataObj
      ) {
        Alert.alert(
          'Próxima data inválida',
          'A próxima manutenção não pode ter data anterior à manutenção realizada.'
        );

        return;
      }

      proximaDataBanco =
        proximaConvertida.banco;
    }

    let proximaKmNumero =
      null;

    if (
      proximaKm.trim()
    ) {
      proximaKmNumero =
        Number(
          proximaKm
        );

      if (
        !Number.isInteger(
          proximaKmNumero
        ) ||
        proximaKmNumero < 0
      ) {
        Alert.alert(
          'Próxima quilometragem inválida',
          'Informe uma quilometragem válida.'
        );

        return;
      }

      if (
        kmNumero !== null &&
        proximaKmNumero <
          kmNumero
      ) {
        Alert.alert(
          'Próxima quilometragem inválida',
          'A próxima quilometragem não pode ser menor que a quilometragem da manutenção atual.'
        );

        return;
      }
    }

    try {
      setSalvando(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigation.replace(
          'Login'
        );

        return;
      }

      const {
        error,
      } = await supabase
        .from('manutencoes')
        .insert({
          usuario_id:
            user.id,

          veiculo_id:
            veiculoSelecionado,

          tipo_manutencao_id:
            tipoSelecionado,

          descricao:
            descricao.trim(),

          valor:
            valorNumero,

          quilometragem:
            kmNumero,

          data_manutencao:
            manutencaoConvertida.banco,

          proxima_data:
            proximaDataBanco,

          proxima_quilometragem:
            proximaKmNumero,

          oficina:
            oficina.trim()
              ? oficina.trim()
              : null,

          observacao:
            observacao.trim()
              ? observacao.trim()
              : null,
        });

      if (error) {
        console.log(
          'Erro manutenção:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível cadastrar a manutenção.'
        );

        return;
      }

      const veiculo =
        veiculos.find(
          (item) =>
            item.id ===
            veiculoSelecionado
        );

      if (
        kmNumero !== null &&
        veiculo &&
        (
          veiculo.quilometragem_atual ===
            null ||
          veiculo.quilometragem_atual ===
            undefined ||
          kmNumero >
            veiculo.quilometragem_atual
        )
      ) {
        await supabase
          .from('veiculos')
          .update({
            quilometragem_atual:
              kmNumero,
          })
          .eq(
            'id',
            veiculoSelecionado
          );
      }

      Alert.alert(
        'Sucesso',
        'Manutenção cadastrada.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.goBack(),
          },
        ]
      );
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao cadastrar a manutenção.'
      );
    } finally {
      setSalvando(false);
    }
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
        Nova manutenção
      </Text>

      <Text
        style={
          styles.subtitulo
        }
      >
        Registre um serviço realizado
        no veículo.
      </Text>

      <Text
        style={
          styles.label
        }
      >
        Veículo *
      </Text>

      {veiculos.map(
        (veiculo) => {
          const selecionado =
            veiculoSelecionado ===
            veiculo.id;

          return (
            <TouchableOpacity
              key={
                veiculo.id
              }
              style={[
                styles.opcaoVeiculo,
                selecionado &&
                  styles.opcaoSelecionada,
              ]}
              onPress={() =>
                selecionarVeiculo(
                  veiculo
                )
              }
            >
              <Text
                style={[
                  styles.textoOpcao,
                  selecionado &&
                    styles.textoSelecionado,
                ]}
              >
                {veiculo.marca}{' '}
                {veiculo.modelo}
              </Text>

              {veiculo.placa && (
                <Text
                  style={[
                    styles.detalheVeiculo,
                    selecionado &&
                      styles.textoSelecionado,
                  ]}
                >
                  {veiculo.placa}
                </Text>
              )}
            </TouchableOpacity>
          );
        }
      )}

      <Text
        style={
          styles.label
        }
      >
        Tipo *
      </Text>

      <View
        style={
          styles.opcoes
        }
      >
        {tipos.map(
          (tipo) => {
            const selecionado =
              tipoSelecionado ===
              tipo.id;

            return (
              <TouchableOpacity
                key={
                  tipo.id
                }
                style={[
                  styles.opcao,
                  selecionado &&
                    styles.opcaoSelecionada,
                ]}
                onPress={() =>
                  setTipoSelecionado(
                    tipo.id
                  )
                }
              >
                <Text
                  style={[
                    styles.textoOpcao,
                    selecionado &&
                      styles.textoSelecionado,
                  ]}
                >
                  {tipo.nome}
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </View>

      <Text
        style={
          styles.label
        }
      >
        Descrição *
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="Ex.: Troca de óleo e filtro"
        value={
          descricao
        }
        onChangeText={
          setDescricao
        }
        maxLength={150}
      />

      <Text
        style={
          styles.label
        }
      >
        Valor
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="Ex.: 180,00"
        keyboardType="decimal-pad"
        value={
          valor
        }
        onChangeText={
          setValor
        }
      />

      <Text
        style={
          styles.label
        }
      >
        Quilometragem
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="Ex.: 60000"
        keyboardType="numeric"
        value={
          quilometragem
        }
        onChangeText={
          setQuilometragem
        }
      />

      <Text
        style={
          styles.label
        }
      >
        Data da manutenção *
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="DD/MM/AAAA"
        keyboardType="numeric"
        maxLength={10}
        value={
          dataManutencao
        }
        onChangeText={(
          texto
        ) =>
          setDataManutencao(
            formatarEntradaData(
              texto
            )
          )
        }
      />

      <View
        style={
          styles.separador
        }
      >
        <Text
          style={
            styles.separadorTitulo
          }
        >
          Próxima manutenção
        </Text>

        <Text
          style={
            styles.separadorTexto
          }
        >
          Opcional. Esses dados serão
          úteis para os lembretes.
        </Text>
      </View>

      <Text
        style={
          styles.label
        }
      >
        Próxima data
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="DD/MM/AAAA"
        keyboardType="numeric"
        maxLength={10}
        value={
          proximaData
        }
        onChangeText={(
          texto
        ) =>
          setProximaData(
            formatarEntradaData(
              texto
            )
          )
        }
      />

      <Text
        style={
          styles.label
        }
      >
        Próxima quilometragem
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="Ex.: 70000"
        keyboardType="numeric"
        value={
          proximaKm
        }
        onChangeText={
          setProximaKm
        }
      />

      <Text
        style={
          styles.label
        }
      >
        Oficina
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="Ex.: Oficina do João"
        value={
          oficina
        }
        onChangeText={
          setOficina
        }
        maxLength={120}
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
          styles.botaoSalvar,
          salvando &&
            styles.desabilitado,
        ]}
        disabled={
          salvando
        }
        onPress={
          salvar
        }
      >
        <Text
          style={
            styles.textoSalvar
          }
        >
          {salvando
            ? 'Salvando...'
            : 'Cadastrar manutenção'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 22,
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

    titulo: {
      fontSize: 29,
      fontWeight: 'bold',
    },

    subtitulo: {
      fontSize: 14,
      marginTop: 5,
      marginBottom: 10,
    },

    label: {
      fontSize: 15,
      fontWeight: '600',
      marginTop: 18,
      marginBottom: 7,
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
      minHeight: 90,
      textAlignVertical:
        'top',
    },

    opcoes: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    opcao: {
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      backgroundColor:
        '#FFFFFF',
      paddingVertical: 10,
      paddingHorizontal: 13,
      borderRadius: 20,
    },

    opcaoVeiculo: {
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      backgroundColor:
        '#FFFFFF',
      padding: 13,
      borderRadius: 9,
      marginBottom: 8,
    },

    opcaoSelecionada: {
      backgroundColor:
        '#222222',
      borderColor:
        '#222222',
    },

    textoOpcao: {
      fontSize: 14,
      fontWeight: '600',
    },

    textoSelecionado: {
      color: '#FFFFFF',
    },

    detalheVeiculo: {
      fontSize: 12,
      marginTop: 3,
    },

    separador: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDDDDD',
      borderRadius: 10,
      padding: 14,
      marginTop: 25,
    },

    separadorTitulo: {
      fontSize: 16,
      fontWeight: 'bold',
    },

    separadorTexto: {
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18,
    },

    botaoSalvar: {
      backgroundColor:
        '#222222',
      padding: 17,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 30,
    },

    textoSalvar: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },

    desabilitado: {
      opacity: 0.6,
    },
  });