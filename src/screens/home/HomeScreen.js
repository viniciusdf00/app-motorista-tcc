import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import { supabase } from '../../services/supabase';

export default function HomeScreen({ navigation }) {
  async function sair() {
    const { error } = await supabase.auth.signOut();

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
        Veículo cadastrado com sucesso.
      </Text>

      <Text style={styles.texto}>
        Nossa Home será construída aqui.
      </Text>

      <TouchableOpacity
        style={styles.botao}
        onPress={sair}
      >
        <Text style={styles.textoBotao}>
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
    fontSize: 18,
    marginBottom: 12,
  },

  texto: {
    fontSize: 15,
  },

  botao: {
    backgroundColor: '#222222',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },

  textoBotao: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});