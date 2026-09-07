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

export default function ExpenseRegisterScreen({
  navigation,
}) {
  const [categorias, setCategorias] =
    useState([]);

  const [veiculos, setVeiculos] =
    useState([]);

  const [
    categoriaSelecionada,
    setCategoriaSelecionada,
  ] = useState(null);

  const [
    veiculoSelecionado,
    setVeiculoSelecionado,
  ] = useState(null);

  const [descricao, setDescricao] =
    useState('');

  const [valor, setValor] =
    useState('');

  const [data, setData] =
    useState(dataHoje());

  const [observacao, setObservacao] =
    useState('');

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  function dataHoje() {
    const hoje = new Date();

    const dia = String(
      hoje.getDate()
    ).padStart(2, '0');

    const mes = String(
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

    if (dataObj > hoje) {
      return 'futura';
    }

    return `${ano}-${String(
      mes
    ).padStart(
      2,
      '0'
    )}-${String(
      dia
    ).padStart(2, '0')}`;
  }

  async function carregarDados() {
    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        navigation.replace(
          'Login'
        );
        return;
      }

      const {
        data: dadosCategorias,
      } = await supabase
        .from(
          'categorias_despesa'
        )
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      const {
        data: dadosVeiculos,
      } = await supabase
        .from('veiculos')
        .select(
          'id, marca, modelo, placa'
        )
        .eq(
          'usuario_id',
          user.id
        )
        .eq('ativo', true)
        .order('marca');

      setCategorias(
        dadosCategorias || []
      );

      setVeiculos(
        dadosVeiculos || []
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

  async function salvar() {
    if (
      !categoriaSelecionada
    ) {
      Alert.alert(
        'Categoria obrigatória',
        'Selecione uma categoria.'
      );

      return;
    }

    if (
      !descricao.trim()
    ) {
      Alert.alert(
        'Descrição obrigatória',
        'Informe a descrição da despesa.'
      );

      return;
    }

    if (!valor.trim()) {
      Alert.alert(
        'Valor obrigatório',
        'Informe o valor da despesa.'
      );

      return;
    }

    const valorNumero =
      Number(
        valor.replace(',', '.')
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

    if (!data.trim()) {
      Alert.alert(
        'Data obrigatória',
        'Informe a data da despesa.'
      );

      return;
    }

    const dataBanco =
      converterData(data);

    if (!dataBanco) {
      Alert.alert(
        'Data inválida',
        'Informe uma data válida no formato DD/MM/AAAA.'
      );

      return;
    }

    if (
      dataBanco === 'futura'
    ) {
      Alert.alert(
        'Data futura',
        'A data da despesa não pode ser posterior à data de hoje.'
      );

      return;
    }

    try {
      setSalvando(true);

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        navigation.replace(
          'Login'
        );

        return;
      }

      const { error } =
        await supabase
          .from('despesas')
          .insert({
            usuario_id:
              user.id,

            categoria_id:
              categoriaSelecionada,

            veiculo_id:
              veiculoSelecionado,

            descricao:
              descricao.trim(),

            valor:
              valorNumero,

            data_despesa:
              dataBanco,

            observacao:
              observacao.trim()
                ? observacao.trim()
                : null,
          });

      if (error) {
        console.log(
          'Erro cadastro:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível cadastrar a despesa.'
        );

        return;
      }

      Alert.alert(
        'Sucesso',
        'Despesa cadastrada.',
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
        'Ocorreu um problema ao cadastrar a despesa.'
      );
    } finally {
      setSalvando(false);
    }
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
      <Text style={styles.titulo}>
        Nova despesa
      </Text>

      <Text
        style={
          styles.subtitulo
        }
      >
        Registre um gasto relacionado
        à sua atividade.
      </Text>

      <Text style={styles.label}>
        Categoria *
      </Text>

      <View
        style={
          styles.opcoes
        }
      >
        {categorias.map(
          (categoria) => {
            const selecionada =
              categoriaSelecionada ===
              categoria.id;

            return (
              <TouchableOpacity
                key={
                  categoria.id
                }
                style={[
                  styles.opcao,
                  selecionada &&
                    styles.opcaoSelecionada,
                ]}
                onPress={() =>
                  setCategoriaSelecionada(
                    categoria.id
                  )
                }
              >
                <Text
                  style={[
                    styles.textoOpcao,
                    selecionada &&
                      styles.textoSelecionado,
                  ]}
                >
                  {categoria.nome}
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </View>

      <Text style={styles.label}>
        Descrição *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ex.: Estacionamento no centro"
        value={descricao}
        onChangeText={
          setDescricao
        }
        maxLength={150}
      />

      <Text style={styles.label}>
        Valor *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ex.: 25,90"
        keyboardType="decimal-pad"
        value={valor}
        onChangeText={
          setValor
        }
      />

      <Text style={styles.label}>
        Data *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="DD/MM/AAAA"
        keyboardType="numeric"
        maxLength={10}
        value={data}
        onChangeText={(texto) =>
          setData(
            formatarEntradaData(
              texto
            )
          )
        }
      />

      <Text style={styles.label}>
        Veículo
      </Text>

      <TouchableOpacity
        style={[
          styles.opcaoVeiculo,
          veiculoSelecionado ===
            null &&
            styles.opcaoSelecionada,
        ]}
        onPress={() =>
          setVeiculoSelecionado(
            null
          )
        }
      >
        <Text
          style={[
            styles.textoOpcao,
            veiculoSelecionado ===
              null &&
              styles.textoSelecionado,
          ]}
        >
          Sem veículo específico
        </Text>
      </TouchableOpacity>

      {veiculos.map(
        (veiculo) => {
          const selecionado =
            veiculoSelecionado ===
            veiculo.id;

          return (
            <TouchableOpacity
              key={veiculo.id}
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
              </Text>
            </TouchableOpacity>
          );
        }
      )}

      <Text style={styles.label}>
        Observação
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.textArea,
        ]}
        placeholder="Opcional"
        multiline
        value={observacao}
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
        disabled={salvando}
        onPress={salvar}
      >
        <Text
          style={
            styles.textoSalvar
          }
        >
          {salvando
            ? 'Salvando...'
            : 'Cadastrar despesa'}
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
      fontSize: 30,
      fontWeight: 'bold',
    },

    subtitulo: {
      fontSize: 14,
      marginTop: 5,
      marginBottom: 15,
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