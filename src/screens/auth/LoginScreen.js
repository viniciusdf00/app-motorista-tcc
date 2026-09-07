import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import { supabase } from '../../services/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  function validarEmail(emailInformado) {
    return /\S+@\S+\.\S+/.test(emailInformado);
  }

  async function efetuarLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert(
        'Campos obrigatórios',
        'Informe o e-mail e a senha.'
      );
      return;
    }

    if (!validarEmail(email)) {
      Alert.alert(
        'E-mail inválido',
        'Informe um endereço de e-mail válido.'
      );
      return;
    }

    try {
      setCarregando(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

      if (error) {
        Alert.alert(
          'Não foi possível entrar',
          'Verifique seu e-mail e senha.'
        );
        return;
      }

      console.log('Usuário autenticado:', data.user.id);

      Alert.alert(
        'Login realizado',
        'Você entrou no aplicativo com sucesso.'
      );
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao realizar o login.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>App Motorista</Text>

      <Text style={styles.subtitulo}>
        Acompanhe sua rotina de trabalho
      </Text>

      <Text style={styles.label}>E-mail</Text>

      <TextInput
        style={styles.input}
        placeholder="seuemail@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Senha</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite sua senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity
        style={[
          styles.botao,
          carregando && styles.botaoDesabilitado,
        ]}
        onPress={efetuarLogin}
        disabled={carregando}
      >
        <Text style={styles.textoBotao}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Cadastro')}
      >
        <Text style={styles.link}>
          Ainda não possui uma conta? Cadastre-se
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#F5F6F8',
  },

  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  subtitulo: {
    fontSize: 16,
    marginBottom: 36,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },

  botao: {
    backgroundColor: '#222222',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 26,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  textoBotao: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  link: {
    textAlign: 'center',
    marginTop: 22,
    fontSize: 14,
  },
});