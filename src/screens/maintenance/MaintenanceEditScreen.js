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

export default function MaintenanceEditScreen({
  route,
  navigation,
}) {
  const {
    manutencao,
  } = route.params;

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
  ] = useState(
    manutencao.veiculo_id
  );

  const [
    tipoSelecionado,
    setTipoSelecionado,
  ] = useState(
    manutencao.tipo_manutencao_id
  );

  const [
    descricao,
    setDescricao,
  ] = useState(
    manutencao.descricao || ''
  );

  const [
    valor,
    setValor,
  ] = useState(
    manutencao.valor !== null &&
      manutencao.valor !== undefined
      ? String(
          manutencao.valor
        ).replace('.', ',')
      : ''
  );

  const [
    quilometragem,
    setQuilometragem,
  ] = useState(
    manutencao.quilometragem !==
      null &&
      manutencao.quilometragem !==
        undefined
      ? String(
          manutencao.quilometragem
        )
      : ''
  );

  const [
    dataManutencao,
    setDataManutencao,
  ] = useState(
    formatarDataBanco(
      manutencao.data_manutencao
    )
  );

  const [
    proximaData,
    setProximaData,
  ] = useState(
    formatarDataBanco(
      manutencao.proxima_data
    )
  );

  const [
    proximaKm,
    setProximaKm,
  ] = useState(
    manutencao.proxima_quilometragem !==
      null &&
      manutencao.proxima_quilometragem !==
        undefined
      ? String(
          manutencao.proxima_quilometragem
        )
      : ''
  );

  const [
    oficina,
    setOficina,
  ] = useState(
    manutencao.oficina || ''
  );

  const [
    observacao,
    setObservacao,
  ] = useState(
    manutencao.observacao || ''
  );

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

  function formatarDataBanco(
    dataBanco
  ) {
    if (!dataBanco) {
      return '';
    }

    const partes =
      dataBanco.split('-');

    if (
      partes.length !== 3
    ) {
      return '';
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
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
          ativo,
          quilometragem_atual
        `)
        .eq(
          'usuario_id',
          user.id
        )
        .order('marca');

      const {
        data: dadosTipos,
      } = await supabase
        .from('tipos_manutencao')
        .select(`
          id,
          nome,
          ativo
        `)
        .order('nome');

      setVeiculos(
        dadosVeiculos || []
      );

      setTipos(
        dadosTipos || []
      );
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

  async function salvarAlteracoes() {
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
        'Informe uma data válida no formato DD/MM/AAAA.'
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
          'Informe uma próxima data válida.'
        );

        return;
      }

      if (
        proximaConvertida.dataObj <
        manutencaoConvertida.dataObj
      ) {
        Alert.alert(
          'Próxima data inválida',
          'A próxima data não pode ser anterior à manutenção realizada.'
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
          'A próxima quilometragem não pode ser menor que a atual.'
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
        .update({
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
        })
        .eq(
          'id',
          manutencao.id
        )
        .eq(
          'usuario_id',
          user.id
        );

      if (error) {
        console.log(
          'Erro edição:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível atualizar a manutenção.'
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
        'Manutenção atualizada.',
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
        'Ocorreu um problema ao atualizar a manutenção.'
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
        Editar manutenção
      </Text>

      <Text
        style={
          styles.subtitulo
        }
      >
        Altere os dados registrados.
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
                setVeiculoSelecionado(
                  veiculo.id
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
                {!veiculo.ativo
                  ? ' (inativo)'
                  : ''}
              </Text>
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
                  {!tipo.ativo
                    ? ' (inativo)'
                    : ''}
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
          Opcional.
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
          salvarAlteracoes
        }
      >
        <Text
          style={
            styles.textoSalvar
          }
        >
          {salvando
            ? 'Salvando...'
            : 'Salvar alterações'}
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