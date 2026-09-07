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

export default function VehicleEditScreen({
  route,
  navigation,
}) {
  const { veiculo } = route.params;

  const [marca, setMarca] =
    useState(veiculo.marca || '');

  const [modelo, setModelo] =
    useState(veiculo.modelo || '');

  const [ano, setAno] =
    useState(
      veiculo.ano
        ? String(veiculo.ano)
        : ''
    );

  const [placa, setPlaca] =
    useState(veiculo.placa || '');

  const [
    tipoCombustivel,
    setTipoCombustivel,
  ] = useState(
    veiculo.tipo_combustivel || ''
  );

  const [
    quilometragem,
    setQuilometragem,
  ] = useState(
    veiculo.quilometragem_atual !== null
      ? String(
          veiculo.quilometragem_atual
        )
      : ''
  );

  const [carregando, setCarregando] =
    useState(false);

  async function salvarAlteracoes() {
    if (
      !marca.trim() ||
      !modelo.trim() ||
      !ano.trim() ||
      !tipoCombustivel ||
      !quilometragem.trim()
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha os campos obrigatórios.'
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
        'Informe um ano válido.'
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

      const { error } = await supabase
        .from('veiculos')
        .update({
          marca: marca.trim(),
          modelo: modelo.trim(),
          ano: anoNumero,
          placa: placa.trim()
            ? placa.trim().toUpperCase()
            : null,
          tipo_combustivel:
            tipoCombustivel,
          quilometragem_atual:
            kmNumero,
        })
        .eq('id', veiculo.id);

      if (error) {
        console.log(
          'Erro ao atualizar veículo:',
          error
        );

        Alert.alert(
          'Erro',
          'Não foi possível atualizar o veículo.'
        );

        return;
      }

      Alert.alert(
        'Veículo atualizado!',
        'As informações foram salvas.',
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
        'Ocorreu um problema ao atualizar o veículo.'
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
        Editar veículo
      </Text>

      <Text style={styles.label}>
        Marca
      </Text>

      <TextInput
        style={styles.input}
        value={marca}
        onChangeText={setMarca}
      />

      <Text style={styles.label}>
        Modelo
      </Text>

      <TextInput
        style={styles.input}
        value={modelo}
        onChangeText={setModelo}
      />

      <Text style={styles.label}>
        Ano
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={ano}
        onChangeText={setAno}
        maxLength={4}
      />

      <Text style={styles.label}>
        Placa
      </Text>

      <TextInput
        style={styles.input}
        autoCapitalize="characters"
        value={placa}
        onChangeText={setPlaca}
        maxLength={8}
      />

      <Text style={styles.label}>
        Tipo de combustível
      </Text>

      <View style={styles.combustiveis}>
        {TIPOS_COMBUSTIVEL.map(
          (combustivel) => (
            <TouchableOpacity
              key={combustivel.value}
              style={[
                styles.botaoCombustivel,

                tipoCombustivel ===
                  combustivel.value &&
                  styles.botaoCombustivelSelecionado,
              ]}
              onPress={() =>
                setTipoCombustivel(
                  combustivel.value
                )
              }
            >
              <Text
                style={[
                  styles.textoCombustivel,

                  tipoCombustivel ===
                    combustivel.value &&
                    styles.textoCombustivelSelecionado,
                ]}
              >
                {combustivel.label}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <Text style={styles.label}>
        Quilometragem atual
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={quilometragem}
        onChangeText={setQuilometragem}
      />

      <TouchableOpacity
        style={[
          styles.botaoSalvar,
          carregando &&
            styles.botaoDesabilitado,
        ]}
        disabled={carregando}
        onPress={salvarAlteracoes}
      >
        <Text style={styles.textoBotao}>
          {carregando
            ? 'Salvando...'
            : 'Salvar alterações'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 28,
    paddingBottom: 40,
    backgroundColor: '#F5F6F8',
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 14,
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
    marginTop: 30,
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