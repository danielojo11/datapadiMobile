import React, { ReactEventHandler } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const categories = ["All", "Data", "Airtime", "Pins", "Funding"];
type CategoryTabsProps = {
  active: String;
  setActive: any;
};

export default function CategoryTabs({ active, setActive }: CategoryTabsProps) {
  return (
    <View style={styles.container}>
      {categories.map((item: any) => (
        <TouchableOpacity
          key={item}
          onPress={() => setActive(item)}
          style={[styles.tab, active === item && styles.activeTab]}
        >
          <Text style={[styles.text, active === item && styles.activeText]}>
            {item}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 20,
    maxHeight: 35,
  },
  tab: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: "#1D4ED8",
  },
  text: {
    fontSize: 13,
    color: "#374151",
  },
  activeText: {
    color: "#fff",
    fontWeight: "600",
  },
});
