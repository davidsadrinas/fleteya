import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FDF6EC",
          borderTopColor: "#DFE6E9",
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#FF7F6B",
        tabBarInactiveTintColor: "#B2BEC3",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          fontFamily: "System",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⌂</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Nuevo",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>◎</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Viajes",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>↹</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>◉</Text>
          ),
        }}
      />
    </Tabs>
  );
}
