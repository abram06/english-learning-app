import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  type TabTriggerSlotProps,
  type TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Pone las pantallas dentro de una navegación con pestañas.
export default function AppTabs() {
  return (
    <Tabs>
      {/* Reserva espacio abajo para que el contenido no quede bajo la barra. */}
      <TabSlot style={styles.screen} />

      {/* TabList organiza los botones de navegación. */}
      <TabList asChild>
        <CustomTabList>
          {/* Estas rutas corresponden a main/index.tsx y main/explore.tsx. */}
          <TabTrigger name="index" href="/main" asChild>
            <TabButton icon="🏠" label="Inicio" />
          </TabTrigger>

          <TabTrigger name="explore" href="/main/explore" asChild>
            <TabButton icon="📚" label="Lecturas" />
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

// Propiedades visuales que necesita cada botón.
type TabButtonProps = TabTriggerSlotProps & {
  icon: string;
  label: string;
};

// Dibuja un botón y resalta la pestaña seleccionada.
function TabButton({ icon, label, isFocused, ...props }: TabButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && styles.selectedTab,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, isFocused && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Dibuja la barra inferior que contiene los botones.
function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={[styles.tabBar, props.style]}>
      <View style={styles.tabRow}>{props.children}</View>
    </View>
  );
}

// Estilos de la barra y sus botones. React Native los usa en web y móvil.
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 104,
  },
  tabBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    maxWidth: 520,
    alignSelf: 'center',
    height: 76,
    padding: 8,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5F4',
    shadowColor: '#24204A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 18,
  },
  selectedTab: {
    backgroundColor: '#E8E7FF',
  },
  icon: {
    fontSize: 20,
  },
  label: {
    color: '#68687D',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedLabel: {
    color: '#4338CA',
  },
  pressed: {
    opacity: 0.7,
  },
});