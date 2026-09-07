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

export default function FuelingRegisterScreen({
  navigation,
}) {
  const [
    veiculos,
    setVeiculos,
  ] = useState([]);

  const [
    veiculoSelecionado,
    setVeiculoSelecionado,
  ] = useState(null);

  const [
    tipoCombustivel,
    setTipoCombustivel,
  ] = useState(null);

  const [
    litros,
    setLitros,
  ] = useState('');

  const [
    valorTotal,
    setValorTotal,
  ] = useState('');

  const [
    quilometragem,
    setQuilometragem,
  ] = useState('');

  const [
    data,
    setData,
  ] = useState(
    dataHoje()
  );

  const [
    tanqueCompleto,
    setTanqueCompleto,
  ] = useState(false);

  const [
    posto,
    setPosto,
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
    carregarVeiculos();
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
        data: dadosVeiculos,
        error,
      } = await supabase
        .from('veiculos')
        .select(`
          id,
          marca,
          modelo,
          placa,
          tipo_combustivel,
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

      const lista =
        dadosVeiculos || [];

      setVeiculos(
        lista
      );

      if (
        lista.length === 1
      ) {
        selecionarVeiculo(
          lista[0],
          lista
        );
      }
    } catch (erro) {
      console.log(erro);
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

    if (
      veiculo.tipo_combustivel ===
      'gasolina'
    ) {
      setTipoCombustivel(
        'gasolina'
      );
    } else if (
      veiculo.tipo_combustivel ===
      'etanol'
    ) {
      setTipoCombustivel(
        'etanol'
      );
    } else if (
      veiculo.tipo_combustivel ===
      'diesel'
    ) {
      setTipoCombustivel(
        'diesel'
      );
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
      !tipoCombustivel
    ) {
      Alert.alert(
        'Combustível obrigatório',
        'Selecione o tipo de combustível.'
      );

      return;
    }

    if (
      !litros.trim()
    ) {
      Alert.alert(
        'Quantidade obrigatória',
        'Informe a quantidade de litros.'
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

    if (
      !valorTotal.trim()
    ) {
      Alert.alert(
        'Valor obrigatório',
        'Informe o valor total do abastecimento.'
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

    if (
      !quilometragem.trim()
    ) {
      Alert.alert(
        'Quilometragem obrigatória',
        'Informe a quilometragem atual do veículo.'
      );

      return;
    }

    const kmNumero =
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

    if (
      !data.trim()
    ) {
      Alert.alert(
        'Data obrigatória',
        'Informe a data do abastecimento.'
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
        .insert({
          usuario_id:
            user.id,

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
        });

      if (error) {
        console.log(
          'Erro abastecimento:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível cadastrar o abastecimento.'
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
        const {
          error: erroKm,
        } = await supabase
          .from('veiculos')
          .update({
            quilometragem_atual:
              kmNumero,
          })
          .eq(
            'id',
            veiculoSelecionado
          );

        if (
          erroKm
        ) {
          console.log(
            'Erro ao atualizar KM:',
            erroKm
          );
        }
      }

      Alert.alert(
        'Sucesso',
        'Abastecimento cadastrado.',
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
        'Ocorreu um problema ao cadastrar o abastecimento.'
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
        Novo abastecimento
      </Text>

      <Text
        style={
          styles.subtitulo
        }
      >
        Registre os dados do
        abastecimento do veículo.
      </Text>

      <Text
        style={
          styles.label
        }
      >
        Veículo *
      </Text>

      {veiculos.length ===
        0 && (
        <Text
          style={
            styles.aviso
          }
        >
          Nenhum veículo ativo
          encontrado.
        </Text>
      )}

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
        placeholder="Ex.: 32,500"
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
        placeholder="Ex.: 150,00"
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
        placeholder="Ex.: 59176"
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
        placeholder="Ex.: Posto Shell"
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
            : 'Cadastrar abastecimento'}
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

    detalheVeiculo: {
      fontSize: 12,
      marginTop: 3,
    },

    aviso: {
      fontSize: 14,
      marginBottom: 5,
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