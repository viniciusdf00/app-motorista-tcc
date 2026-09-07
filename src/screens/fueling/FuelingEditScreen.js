import {
  useEffect,
  useMemo,
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

const COMBUSTIVEIS = [
  {
    label: 'Gasolina',
    value: 'gasolina',
  },
  {
    label: 'Etanol',
    value: 'etanol',
  },
  {
    label: 'Diesel',
    value: 'diesel',
  },
  {
    label: 'GNV',
    value: 'gnv',
  },
];

export default function FuelingEditScreen({
  route,
  navigation,
}) {
  const {
    abastecimento,
  } = route.params;

  const [
    veiculos,
    setVeiculos,
  ] = useState([]);

  const [
    veiculoSelecionado,
    setVeiculoSelecionado,
  ] = useState(
    abastecimento.veiculo_id
  );

  const [
    tipoCombustivel,
    setTipoCombustivel,
  ] = useState(
    abastecimento.tipo_combustivel
  );

  const [
    litros,
    setLitros,
  ] = useState(
    String(
      abastecimento.quantidade_litros ||
        ''
    ).replace('.', ',')
  );

  const [
    valorTotal,
    setValorTotal,
  ] = useState(
    String(
      abastecimento.valor_total ||
        ''
    ).replace('.', ',')
  );

  const [
    quilometragem,
    setQuilometragem,
  ] = useState(
    String(
      abastecimento.quilometragem ||
        ''
    )
  );

  const [
    data,
    setData,
  ] = useState(
    formatarDataBanco(
      abastecimento.data_abastecimento
    )
  );

  const [
    tanqueCompleto,
    setTanqueCompleto,
  ] = useState(
    Boolean(
      abastecimento.tanque_completo
    )
  );

  const [
    posto,
    setPosto,
  ] = useState(
    abastecimento.posto || ''
  );

  const [
    observacao,
    setObservacao,
  ] = useState(
    abastecimento.observacao ||
      ''
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
    carregarVeiculos();
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

    const hoje =
      new Date();

    hoje.setHours(
      0,
      0,
      0,
      0
    );

    if (
      dataObj > hoje
    ) {
      return 'futura';
    }

    return `${ano}-${String(
      mes
    ).padStart(
      2,
      '0'
    )}-${String(
      dia
    ).padStart(
      2,
      '0'
    )}`;
  }

  async function carregarVeiculos() {
    try {
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
        data,
        error,
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

      if (error) {
        console.log(
          'Erro veículos:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível carregar os veículos.'
        );

        return;
      }

      setVeiculos(
        data || []
      );
    } catch (erro) {
      console.log(erro);
    } finally {
      setCarregando(false);
    }
  }

  const precoLitro =
    useMemo(() => {
      const litrosNumero =
        Number(
          litros.replace(
            ',',
            '.'
          )
        );

      const valorNumero =
        Number(
          valorTotal.replace(
            ',',
            '.'
          )
        );

      if (
        !Number.isFinite(
          litrosNumero
        ) ||
        !Number.isFinite(
          valorNumero
        ) ||
        litrosNumero <= 0
      ) {
        return 0;
      }

      return (
        valorNumero /
        litrosNumero
      );
    }, [
      litros,
      valorTotal,
    ]);

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
      !tipoCombustivel
    ) {
      Alert.alert(
        'Combustível obrigatório',
        'Selecione o tipo de combustível.'
      );

      return;
    }

    const litrosNumero =
      Number(
        litros.replace(
          ',',
          '.'
        )
      );

    if (
      !litros.trim() ||
      !Number.isFinite(
        litrosNumero
      ) ||
      litrosNumero <= 0
    ) {
      Alert.alert(
        'Quantidade inválida',
        'Informe uma quantidade de litros maior que zero.'
      );

      return;
    }

    const valorNumero =
      Number(
        valorTotal.replace(
          ',',
          '.'
        )
      );

    if (
      !valorTotal.trim() ||
      !Number.isFinite(
        valorNumero
      ) ||
      valorNumero <= 0
    ) {
      Alert.alert(
        'Valor inválido',
        'Informe um valor maior que zero.'
      );

      return;
    }

    const kmNumero =
      Number(
        quilometragem
      );

    if (
      !quilometragem.trim() ||
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

    const dataBanco =
      converterData(data);

    if (!dataBanco) {
      Alert.alert(
        'Data inválida',
        'Informe uma data existente no formato DD/MM/AAAA.'
      );

      return;
    }

    if (
      dataBanco ===
      'futura'
    ) {
      Alert.alert(
        'Data futura',
        'A data do abastecimento não pode ser posterior à data de hoje.'
      );

      return;
    }

    try {
      setSalvando(true);

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
        error,
      } = await supabase
        .from(
          'abastecimentos'
        )
        .update({
          veiculo_id:
            veiculoSelecionado,

          tipo_combustivel:
            tipoCombustivel,

          quantidade_litros:
            litrosNumero,

          valor_total:
            valorNumero,

          quilometragem:
            kmNumero,

          data_abastecimento:
            dataBanco,

          tanque_completo:
            tanqueCompleto,

          posto:
            posto.trim()
              ? posto.trim()
              : null,

          observacao:
            observacao.trim()
              ? observacao.trim()
              : null,
        })
        .eq(
          'id',
          abastecimento.id
        )
        .eq(
          'usuario_id',
          user.id
        );

      if (error) {
        console.log(
          'Erro ao editar:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível atualizar o abastecimento.'
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
        'Abastecimento atualizado.',
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
        'Ocorreu um problema ao atualizar o abastecimento.'
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
        Editar abastecimento
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
        Combustível *
      </Text>

      <View
        style={
          styles.opcoes
        }
      >
        {COMBUSTIVEIS.map(
          (combustivel) => {
            const selecionado =
              tipoCombustivel ===
              combustivel.value;

            return (
              <TouchableOpacity
                key={
                  combustivel.value
                }
                style={[
                  styles.opcao,
                  selecionado &&
                    styles.opcaoSelecionada,
                ]}
                onPress={() =>
                  setTipoCombustivel(
                    combustivel.value
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
                  {
                    combustivel.label
                  }
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
        Quantidade de litros *
      </Text>

      <TextInput
        style={
          styles.input
        }
        keyboardType="decimal-pad"
        value={
          litros
        }
        onChangeText={
          setLitros
        }
      />

      <Text
        style={
          styles.label
        }
      >
        Valor total *
      </Text>

      <TextInput
        style={
          styles.input
        }
        keyboardType="decimal-pad"
        value={
          valorTotal
        }
        onChangeText={
          setValorTotal
        }
      />

      {precoLitro > 0 && (
        <View
          style={
            styles.calculo
          }
        >
          <Text
            style={
              styles.calculoLabel
            }
          >
            Preço por litro
          </Text>

          <Text
            style={
              styles.calculoValor
            }
          >
            {formatarDinheiro(
              precoLitro
            )}
            /L
          </Text>
        </View>
      )}

      <Text
        style={
          styles.label
        }
      >
        Quilometragem *
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
        Data *
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="DD/MM/AAAA"
        keyboardType="numeric"
        maxLength={10}
        value={
          data
        }
        onChangeText={(
          texto
        ) =>
          setData(
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
        Tanque completo
      </Text>

      <TouchableOpacity
        style={[
          styles.toggle,
          tanqueCompleto &&
            styles.toggleAtivo,
        ]}
        onPress={() =>
          setTanqueCompleto(
            !tanqueCompleto
          )
        }
      >
        <Text
          style={[
            styles.toggleTexto,
            tanqueCompleto &&
              styles.textoSelecionado,
          ]}
        >
          {tanqueCompleto
            ? '✓ Sim, tanque completo'
            : 'Não'}
        </Text>
      </TouchableOpacity>

      <Text
        style={
          styles.label
        }
      >
        Posto
      </Text>

      <TextInput
        style={
          styles.input
        }
        value={
          posto
        }
        onChangeText={
          setPosto
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
      paddingHorizontal: 14,
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

    calculo: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDDDDD',
      borderRadius: 10,
      padding: 14,
      marginTop: 10,
    },

    calculoLabel: {
      fontSize: 12,
      marginBottom: 3,
    },

    calculoValor: {
      fontSize: 18,
      fontWeight: 'bold',
    },

    toggle: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      padding: 14,
      borderRadius: 10,
    },

    toggleAtivo: {
      backgroundColor:
        '#222222',
      borderColor:
        '#222222',
    },

    toggleTexto: {
      fontSize: 14,
      fontWeight: '600',
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