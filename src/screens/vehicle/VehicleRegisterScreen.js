import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import { supabase } from '../../services/supabase';

const TIPOS_COMBUSTIVEL = [
  { label: 'Gasolina', value: 'gasolina' },
  { label: 'Etanol', value: 'etanol' },
  { label: 'Flex', value: 'flex' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'Elétrico', value: 'eletrico' },
  { label: 'Híbrido', value: 'hibrido' },
];

export default function VehicleRegisterScreen({ navigation }) {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [placa, setPlaca] = useState('');
  const [tipoCombustivel, setTipoCombustivel] = useState('');
  const [quilometragem, setQuilometragem] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function salvarVeiculo() {
    if (
      !marca.trim() ||
      !modelo.trim() ||
      !ano.trim() ||
      !tipoCombustivel ||
      !quilometragem.trim()
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha marca, modelo, ano, combustível e quilometragem.'
      );
      return;
    }

    const anoNumero = Number(ano);
    const kmNumero = Number(quilometragem);

    if (
      !Number.isInteger(anoNumero) ||
      anoNumero < 1980 ||
      anoNumero > 2100
    ) {
      Alert.alert(
        'Ano inválido',
        'Informe um ano válido para o veículo.'
      );
      return;
    }

    if (
      !Number.isFinite(kmNumero) ||
      kmNumero < 0
    ) {
      Alert.alert(
        'Quilometragem inválida',
        'Informe uma quilometragem válida.'
      );
      return;
    }

    try {
      setCarregando(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          'Sessão inválida',
          'Faça login novamente para continuar.'
        );
        navigation.replace('Login');
        return;
      }

      const { error } = await supabase
        .from('veiculos')
        .insert({
          usuario_id: user.id,
          marca: marca.trim(),
          modelo: modelo.trim(),
          ano: anoNumero,
          placa: placa.trim()
            ? placa.trim().toUpperCase()
            : null,
          tipo_combustivel: tipoCombustivel,
          quilometragem_atual: kmNumero,
          ativo: true,
        });

      if (error) {
        console.log('Erro ao cadastrar veículo:', error);

        Alert.alert(
          'Erro ao cadastrar veículo',
          error.message
        );
        return;
      }

      Alert.alert(
        'Veículo cadastrado!',
        'Seu veículo foi salvo com sucesso.',
        [
          {
            text: 'Continuar',
            onPress: () => navigation.replace('Home'),
          },
        ]
      );
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao salvar o veículo.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>
        Cadastre seu veículo
      </Text>

      <Text style={styles.subtitulo}>
        Essas informações serão usadas para acompanhar suas jornadas,
        abastecimentos e manutenções.
      </Text>

      <Text style={styles.label}>Marca</Text>

      <TextInput
        style={styles.input}
        placeholder="Ex.: Renault"
        value={marca}
        onChangeText={setMarca}
      />

      <Text style={styles.label}>Modelo</Text>

      <TextInput
        style={styles.input}
        placeholder="Ex.: Kwid"
        value={modelo}
        onChangeText={setModelo}
      />

      <Text style={styles.label}>Ano</Text>

      <TextInput
        style={styles.input}
        placeholder="Ex.: 2022"
        keyboardType="numeric"
        value={ano}
        onChangeText={setAno}
        maxLength={4}
      />

      <Text style={styles.label}>Placa</Text>

      <TextInput
        style={styles.input}
        placeholder="Ex.: ABC1D23"
        autoCapitalize="characters"
        value={placa}
        onChangeText={setPlaca}
        maxLength={8}
      />

      <Text style={styles.label}>
        Tipo de combustível
      </Text>

      <View style={styles.combustiveis}>
        {TIPOS_COMBUSTIVEL.map((combustivel) => (
          <TouchableOpacity
            key={combustivel.value}
            style={[
              styles.botaoCombustivel,
              tipoCombustivel === combustivel.value &&
                styles.botaoCombustivelSelecionado,
            ]}
            onPress={() =>
              setTipoCombustivel(combustivel.value)
            }
          >
            <Text
              style={[
                styles.textoCombustivel,
                tipoCombustivel === combustivel.value &&
                  styles.textoCombustivelSelecionado,
              ]}
            >
              {combustivel.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>
        Quilometragem atual
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Ex.: 65000"
        keyboardType="numeric"
        value={quilometragem}
        onChangeText={setQuilometragem}
      />

      <TouchableOpacity
        style={[
          styles.botaoSalvar,
          carregando && styles.botaoDesabilitado,
        ]}
        onPress={salvarVeiculo}
        disabled={carregando}
      >
        <Text style={styles.textoBotaoSalvar}>
          {carregando
            ? 'Salvando...'
            : 'Salvar veículo'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 28,
    paddingTop: 50,
    paddingBottom: 40,
    backgroundColor: '#F5F6F8',
  },

  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 22,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },

  combustiveis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  botaoCombustivel: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  botaoCombustivelSelecionado: {
    backgroundColor: '#222222',
    borderColor: '#222222',
  },

  textoCombustivel: {
    fontSize: 14,
  },

  textoCombustivelSelecionado: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  botaoSalvar: {
    backgroundColor: '#222222',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 32,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  textoBotaoSalvar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});