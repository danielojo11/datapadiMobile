import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileHeader from "../components/ProfileHeader";
import ProfileWallet from "../components/ProfileWallet";
import SettingsItem from "../components/SettingsItem";
import LogoutVersion from "../components/LogoutVersion";
import { useRouter } from "expo-router";
import { getProfileData } from "@/app/utils/user";
import ActionRequired from "../components/drawers/ActionRequired";

interface Profile {
  fullName: string;
  email: string;
  isKycVerified: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();

  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [warningModalVisisbility, setWarningModalVisibility] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getProfileData();

        if (!response) {
          console.log("Profile fetch failed");
          return;
        }

        setProfileData(response.data);
      } catch (error) {
        console.log("Profile screen error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#f5f5f5",
      }}
    >
      <ActionRequired
        visible={warningModalVisisbility}
        onClose={() => setWarningModalVisibility(false)}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          name={profileData?.fullName ?? ""}
          email={profileData?.email ?? ""}
          isKYCVerified={profileData?.isKycVerified ?? false}
          onPush={() => setWarningModalVisibility(true)}
        />

        <ProfileWallet />

        <View style={styles.settingsCard}>
          <SettingsItem icon="person-outline" title="Personal Information" />
          <SettingsItem icon="shield-outline" title="Security & Privacy" />
          <SettingsItem icon="card-outline" title="Cards & Banks" />
          <SettingsItem icon="notifications-outline" title="Notifications" />
          <SettingsItem icon="help-circle-outline" title="Help & Support" />
        </View>

        <LogoutVersion />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 40,
  },
});
