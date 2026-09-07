import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import VehicleRegisterScreen from '../screens/vehicle/VehicleRegisterScreen';
import VehiclesScreen from '../screens/vehicle/VehiclesScreen';
import VehicleEditScreen from '../screens/vehicle/VehicleEditScreen';

import HomeScreen from '../screens/home/HomeScreen';

import StartJourneyScreen from '../screens/journey/StartJourneyScreen';
import ActiveJourneyScreen from '../screens/journey/ActiveJourneyScreen';
import FinishJourneyScreen from '../screens/journey/FinishJourneyScreen';
import JourneySummaryScreen from '../screens/journey/JourneySummaryScreen';
import JourneyHistoryScreen from '../screens/journey/JourneyHistoryScreen';

import ExpensesScreen from '../screens/expense/ExpensesScreen';
import ExpenseRegisterScreen from '../screens/expense/ExpenseRegisterScreen';
import ExpenseEditScreen from '../screens/expense/ExpenseEditScreen';

const Stack =
  createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Cadastro"
          component={RegisterScreen}
          options={{
            title: 'Criar conta',
          }}
        />

        <Stack.Screen
          name="CadastroVeiculo"
          component={
            VehicleRegisterScreen
          }
          options={{
            title: 'Cadastrar veículo',
          }}
        />

        <Stack.Screen
          name="MeusVeiculos"
          component={
            VehiclesScreen
          }
          options={{
            title: 'Meus veículos',
          }}
        />

        <Stack.Screen
          name="EditarVeiculo"
          component={
            VehicleEditScreen
          }
          options={{
            title: 'Editar veículo',
          }}
        />

        <Stack.Screen
          name="IniciarJornada"
          component={
            StartJourneyScreen
          }
          options={{
            title: 'Iniciar jornada',
          }}
        />

        <Stack.Screen
          name="JornadaAtiva"
          component={
            ActiveJourneyScreen
          }
          options={{
            title: 'Jornada',
            headerBackVisible:
              false,
          }}
        />

        <Stack.Screen
          name="FinalizarJornada"
          component={
            FinishJourneyScreen
          }
          options={{
            title: 'Finalizar jornada',
          }}
        />

        <Stack.Screen
          name="ResumoJornada"
          component={
            JourneySummaryScreen
          }
          options={{
            title: 'Resumo da jornada',
          }}
        />

        <Stack.Screen
          name="HistoricoJornadas"
          component={
            JourneyHistoryScreen
          }
          options={{
            title: 'Histórico',
          }}
        />

        <Stack.Screen
          name="Despesas"
          component={
            ExpensesScreen
          }
          options={{
            title: 'Despesas',
          }}
        />

        <Stack.Screen
          name="CadastrarDespesa"
          component={
            ExpenseRegisterScreen
          }
          options={{
            title: 'Nova despesa',
          }}
        />

        <Stack.Screen
          name="EditarDespesa"
          component={
            ExpenseEditScreen
          }
          options={{
            title: 'Editar despesa',
          }}
        />

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}