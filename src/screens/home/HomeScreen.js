import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import { supabase } from '../../services/supabase';

export default function HomeScreen({
  navigation,
}) {
  async function sair() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      Alert.alert(
        'Erro',
        'Não foi possível sair do aplicativo.'
      );

      return;
    }

    navigation.replace('Login');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        App Motorista
      </Text>

      <Text style={styles.subtitulo}>
        Bem-vindo!
      </Text>

      <Text style={styles.texto}>
        Estamos construindo sua área de acompanhamento.
      </Text>

      <TouchableOpacity
        style={styles.botaoPrincipal}
        onPress={() =>
          navigation.navigate(
            'MeusVeiculos'
          )
        }
      >
        <Text style={styles.textoBotao}>
          Meus veículos
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botaoSair}
        onPress={sair}
      >
        <Text style={styles.textoSair}>
          Sair
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
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },

  texto: {
    fontSize: 15,
    marginBottom: 28,
  },

  botaoPrincipal: {
    backgroundColor: '#222222',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },

  textoBotao: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  botaoSair: {
    marginTop: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    alignItems: 'center',
  },

  textoSair: {
    fontSize: 16,
    fontWeight: '600',
  },
});