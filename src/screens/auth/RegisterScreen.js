import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';

import { supabase } from '../../services/supabase';

export default function RegisterScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  function validarEmail(emailInformado) {
    return /\S+@\S+\.\S+/.test(emailInformado);
  }

  function validarSenha(senhaInformada) {
    const temMinimoCaracteres = senhaInformada.length >= 8;
    const temLetra = /[A-Za-z]/.test(senhaInformada);
    const temNumero = /[0-9]/.test(senhaInformada);

    return temMinimoCaracteres && temLetra && temNumero;
  }

  async function cadastrarUsuario() {
    if (
      !nome.trim() ||
      !email.trim() ||
      !senha.trim() ||
      !confirmarSenha.trim()
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha todos os campos para continuar.'
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

    if (!validarSenha(senha)) {
      Alert.alert(
        'Senha inválida',
        'A senha deve possuir no mínimo 8 caracteres, incluindo pelo menos uma letra e um número.'
      );
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert(
        'Senhas diferentes',
        'A confirmação da senha deve ser igual à senha informada.'
      );
      return;
    }

    try {
      setCarregando(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: {
            nome: nome.trim(),
          },
        },
      });

      if (error) {
        Alert.alert(
          'Não foi possível criar a conta',
          error.message
        );
        return;
      }

      if (!data.session) {
        Alert.alert(
          'Conta criada!',
          'Verifique seu e-mail para confirmar o cadastro.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
        return;
      }

      Alert.alert(
        'Conta criada!',
        'Seu cadastro foi realizado com sucesso.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (erro) {
      console.log(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao realizar o cadastro.'
      );
    } finally {
      setCarregando(false);
    }
  }

  const senhaTem8Caracteres = senha.length >= 8;
  const senhaTemLetra = /[A-Za-z]/.test(senha);
  const senhaTemNumero = /[0-9]/.test(senha);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Criar conta</Text>

      <Text style={styles.subtitulo}>
        Cadastre seus dados para começar
      </Text>

      <Text style={styles.label}>Nome</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite seu nome"
        value={nome}
        onChangeText={setNome}
      />

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

      <View style={styles.regrasSenha}>
        <Text
          style={[
            styles.regra,
            senhaTem8Caracteres && styles.regraValida,
          ]}
        >
          • Mínimo de 8 caracteres
        </Text>

        <Text
          style={[
            styles.regra,
            senhaTemLetra && styles.regraValida,
          ]}
        >
          • Pelo menos uma letra
        </Text>

        <Text
          style={[
            styles.regra,
            senhaTemNumero && styles.regraValida,
          ]}
        >
          • Pelo menos um número
        </Text>
      </View>

      <Text style={styles.label}>Confirmar senha</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite sua senha novamente"
        secureTextEntry
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
      />

      <TouchableOpacity
        style={[
          styles.botao,
          carregando && styles.botaoDesabilitado,
        ]}
        onPress={cadastrarUsuario}
        disabled={carregando}
      >
        <Text style={styles.textoBotao}>
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.link}>
          Já possui uma conta? Entrar
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#F5F6F8',
  },

  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  subtitulo: {
    fontSize: 16,
    marginBottom: 28,
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

  regrasSenha: {
    marginTop: 10,
  },

  regra: {
    fontSize: 13,
    marginBottom: 4,
  },

  regraValida: {
    fontWeight: 'bold',
  },

  botao: {
    backgroundColor: '#222222',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 28,
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
    marginBottom: 20,
  },
});