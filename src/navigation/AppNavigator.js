import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import VehicleRegisterScreen from '../screens/vehicle/VehicleRegisterScreen';
import VehiclesScreen from '../screens/vehicle/VehiclesScreen';
import VehicleEditScreen from '../screens/vehicle/VehicleEditScreen';

import HomeScreen from '../screens/home/HomeScreen';

const Stack = createNativeStackNavigator();

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
          component={VehicleRegisterScreen}
          options={{
            title: 'Cadastrar veículo',
          }}
        />

        <Stack.Screen
          name="MeusVeiculos"
          component={VehiclesScreen}
          options={{
            title: 'Meus veículos',
          }}
        />

        <Stack.Screen
          name="EditarVeiculo"
          component={VehicleEditScreen}
          options={{
            title: 'Editar veículo',
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