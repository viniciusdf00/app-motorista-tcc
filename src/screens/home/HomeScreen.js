import {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import { supabase } from '../../services/supabase';

export default function HomeScreen({
  navigation,
}) {
  const [
    jornadaAtiva,
    setJornadaAtiva,
  ] = useState(null);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  useFocusEffect(
    useCallback(() => {
      verificarJornadaAtiva();
    }, [])
  );

  async function verificarJornadaAtiva() {
    try {
      setCarregando(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigation.replace('Login');
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from('jornadas')
        .select('id, inicio')
        .eq(
          'usuario_id',
          user.id
        )
        .eq(
          'status',
          'em_andamento'
        )
        .order('inicio', {
          ascending: false,
        })
        .limit(1);

      if (error) {
        console.log(
          'Erro ao verificar jornada:',
          error
        );

        return;
      }

      if (
        data &&
        data.length > 0
      ) {
        setJornadaAtiva(
          data[0]
        );
      } else {
        setJornadaAtiva(
          null
        );
      }
    } catch (erro) {
      console.log(erro);
    } finally {
      setCarregando(false);
    }
  }

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

    navigation.replace(
      'Login'
    );
  }

  function abrirJornada() {
    if (jornadaAtiva) {
      navigation.navigate(
        'JornadaAtiva',
        {
          jornadaId:
            jornadaAtiva.id,
        }
      );
    } else {
      navigation.navigate(
        'IniciarJornada'
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        App Motorista
      </Text>

      <Text style={styles.subtitulo}>
        Bem-vindo!
      </Text>

      {jornadaAtiva && (
        <View
          style={
            styles.avisoJornada
          }
        >
          <Text
            style={
              styles.avisoJornadaTitulo
            }
          >
            Jornada em andamento
          </Text>

          <Text
            style={
              styles.avisoJornadaTexto
            }
          >
            Você possui uma jornada
            ativa.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={
          styles.botaoJornada
        }
        onPress={abrirJornada}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator />
        ) : (
          <Text
            style={
              styles.textoBotao
            }
          >
            {jornadaAtiva
              ? 'Continuar jornada'
              : 'Iniciar jornada'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={
          styles.botaoSecundario
        }
        onPress={() =>
          navigation.navigate(
            'HistoricoJornadas'
          )
        }
      >
        <Text
          style={
            styles.textoSecundario
          }
        >
          Histórico de jornadas
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={
          styles.botaoSecundario
        }
        onPress={() =>
          navigation.navigate(
            'MeusVeiculos'
          )
        }
      >
        <Text
          style={
            styles.textoSecundario
          }
        >
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

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent:
        'center',
      padding: 28,
      backgroundColor:
        '#F5F6F8',
    },

    titulo: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 8,
    },

    subtitulo: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 25,
    },

    avisoJornada: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#DDDDDD',
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
    },

    avisoJornadaTitulo: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },

    avisoJornadaTexto: {
      fontSize: 14,
    },

    botaoJornada: {
      backgroundColor:
        '#222222',
      padding: 17,
      borderRadius: 10,
      alignItems: 'center',
    },

    textoBotao: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },

    botaoSecundario: {
      marginTop: 12,
      padding: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      alignItems: 'center',
    },

    textoSecundario: {
      fontSize: 16,
      fontWeight: '600',
    },

    botaoSair: {
      marginTop: 25,
      padding: 12,
      alignItems: 'center',
    },

    textoSair: {
      fontSize: 15,
    },
  });