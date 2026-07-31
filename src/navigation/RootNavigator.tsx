import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EncargosScreen from '../screens/encargos/EncargosScreen';
import EncargoFormScreen from '../screens/encargos/EncargoFormScreen';
import CochesScreen from '../screens/coches/CochesScreen';
import CocheFormScreen from '../screens/coches/CocheFormScreen';
import AcuerdosScreen from '../screens/acuerdos/AcuerdosScreen';
import AcuerdoFormScreen from '../screens/acuerdos/AcuerdoFormScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Settings: undefined;
  Notifications: undefined;
};

export type EncargosStackParamList = {
  EncargosList: undefined;
  EncargoForm: { id?: string };
};

export type CochesStackParamList = {
  CochesList: undefined;
  CocheForm: { id?: string };
};

export type AcuerdosStackParamList = {
  AcuerdosList: undefined;
  AcuerdoForm: { id?: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const EncargosStack = createNativeStackNavigator<EncargosStackParamList>();
const CochesStack = createNativeStackNavigator<CochesStackParamList>();
const AcuerdosStack = createNativeStackNavigator<AcuerdosStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
  headerShadowVisible: false,
};

function EncargosNavigator() {
  return (
    <EncargosStack.Navigator screenOptions={screenOptions}>
      <EncargosStack.Screen name="EncargosList" component={EncargosScreen} options={{ title: 'Encargos' }} />
      <EncargosStack.Screen name="EncargoForm" component={EncargoFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Editar encargo' : 'Nuevo encargo' })} />
    </EncargosStack.Navigator>
  );
}

function CochesNavigator() {
  return (
    <CochesStack.Navigator screenOptions={screenOptions}>
      <CochesStack.Screen name="CochesList" component={CochesScreen} options={{ title: 'Coches' }} />
      <CochesStack.Screen name="CocheForm" component={CocheFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Editar coche' : 'Nuevo coche' })} />
    </CochesStack.Navigator>
  );
}

function AcuerdosNavigator() {
  return (
    <AcuerdosStack.Navigator screenOptions={screenOptions}>
      <AcuerdosStack.Screen name="AcuerdosList" component={AcuerdosScreen} options={{ title: 'Acuerdos' }} />
      <AcuerdosStack.Screen name="AcuerdoForm" component={AcuerdoFormScreen} options={({ route }) => ({ title: route.params?.id ? 'Editar acuerdo' : 'Nuevo acuerdo' })} />
    </AcuerdosStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: 'grid-outline',
            Encargos: 'clipboard-outline',
            Coches: 'car-outline',
            Acuerdos: 'checkmark-circle-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Encargos" component={EncargosNavigator} />
      <Tab.Screen name="Coches" component={CochesNavigator} />
      <Tab.Screen name="Acuerdos" component={AcuerdosNavigator} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: true, title: 'Ajustes', ...screenOptions }}
          />
          <RootStack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: true, title: 'Novedades', ...screenOptions }}
          />
        </>
      ) : (
        <RootStack.Screen name="Login" component={LoginScreen} />
      )}
    </RootStack.Navigator>
  );
}
