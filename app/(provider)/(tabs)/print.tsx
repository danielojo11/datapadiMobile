import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  VirtualizedList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PrintPreview from "../components/drawers/PrintPreview";
import BottomBar from "../components/BottomBar";
import { getPrintInventory, printRechargePins } from "@/app/utils/vtu";

type Item = any | never | undefined | null;

type RenderBatchProps = {
  item: Item;
};

export default function print() {
  const [activeTab, setActiveTab] = useState("newPrint");
  const [selectionMode, setSelectionMode] = useState(false);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 20,
        paddingTop: 0,
        paddingBottom: 0,
        backgroundColor: "#f5f5f5",
      }}
    >
      {activeTab === "newPrint" ? (
        <View style={styles.header}>
          <Text style={styles.title}>Recharge Printing</Text>
        </View>
      ) : (
        <View style={styles.header}>
          <Text style={styles.title}>Recharge Printing</Text>
          <TouchableOpacity onPress={() => setSelectionMode(!selectionMode)}>
            <Text style={styles.selectMultiple}>
              {selectionMode ? "Cancel" : "Select Multiple"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "newPrint" && styles.activeTab]}
          onPress={() => setActiveTab("newPrint")}
        >
          <Text
            style={
              activeTab === "newPrint" ? styles.activeTabText : styles.tabText
            }
          >
            New Print
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "inventory" && styles.activeTab]}
          onPress={() => setActiveTab("inventory")}
        >
          <Text
            style={
              activeTab === "inventory" ? styles.activeTabText : styles.tabText
            }
          >
            Pin Inventory
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "newPrint" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.tabContent}
        >
          <NewPrint />
        </ScrollView>
      ) : (
        <View style={styles.tabContent}>
          <PinInven
            selectMode={selectionMode}
            setSelectMode={setSelectionMode}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const NewPrint = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<null | any>(null);
  const [selectedDenomination, setSelectedDenomination] = useState<any>(null);
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>();
  const [success, setSuccess] = useState(false);

  const networks = [
    { id: "MTN", label: "MTN", color: "#FFD700" },
    { id: "AIRTEL", label: "AIRTEL", color: "#FF0000" },
    { id: "GLO", label: "GLO", color: "#00FF00" },
    { id: "9MOBILE", label: "9MOBILE", color: "#004d00" },
  ];

  const denominations = [100, 200, 500];

  const handleQuantityChange = (text: any) => {
    const qty = parseInt(text) || 0;
    setQuantity(text);
    if (selectedDenomination) {
      setTotalCost(qty * selectedDenomination);
    } else {
      setTotalCost(0);
    }
  };

  const handleDenominationSelect = (value: any) => {
    setSelectedDenomination(value);
    if (quantity) {
      setTotalCost(parseInt(quantity) * value);
    }
  };

  const handlePinGeneration = async () => {
    try {
      setLoading(true);
      if (!selectedDenomination) {
        throw new Error("Please select a denomination");
      }
      const response = await printRechargePins(selectedNetwork, selectedDenomination.toString(), Number(quantity));
      setError(response.error)
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
      setQuantity("");
      setSelectedDenomination(null);
      setSelectedNetwork(null);
      setTotalCost(0);
      setSuccess(true);
    }

  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Recharge Printing</Text>
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 1. Select Network */}
      <Text style={styles.sectionTitle}>1. Select Network</Text>
      <View style={styles.networkContainer}>
        {networks.map((network) => (
          <TouchableOpacity
            key={network.id}
            style={[
              styles.networkButton,
              selectedNetwork === network.id && {
                borderColor: "#00f",
                borderWidth: 2,
                borderRadius: 15,
              },
            ]}
            onPress={() => setSelectedNetwork(network.id)}
          >
            <View
              style={[styles.networkCircle, { backgroundColor: network.color }]}
            >
              <Text style={styles.networkLetter}>{network.label[0]}</Text>
            </View>
            <Text style={styles.networkLabel}>{network.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. Select Denomination */}
      <Text style={styles.sectionTitle}>2. Select Denomination</Text>
      <View style={styles.denominationContainer}>
        {denominations.map((denom) => (
          <TouchableOpacity
            key={denom}
            style={[
              styles.denominationButton,
              selectedDenomination === denom && {
                backgroundColor: "#cce0ff",
              },
            ]}
            onPress={() => handleDenominationSelect(denom)}
          >
            <Text style={styles.denominationText}>₦{denom}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. Quantity */}
      <Text style={styles.sectionTitle}>3. Quantity</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex. 10 (Max 100)"
        keyboardType="numeric"
        value={quantity}
        onChangeText={handleQuantityChange}
      />

      {/* Total Cost */}
      <View style={styles.totalCostContainer}>
        <Text style={styles.totalCostText}>Total Cost</Text>
        <Text style={styles.totalCostValue}>₦{totalCost}</Text>
      </View>

      {/* Generate Button */}
      {totalCost === 0 ? (
        <TouchableOpacity
          style={{ ...styles.generateButton, backgroundColor: "#8b9eff" }}
        >
          <Text style={styles.generateButtonText}>Generate PINs</Text>
        </TouchableOpacity>
      ) : (<>
        {
          loading ? (<TouchableOpacity
            style={{ ...styles.generateButton, backgroundColor: "#00f" }}
            disabled
          >
            <ActivityIndicator color="#fff" />
          </TouchableOpacity>) : (
            <TouchableOpacity
              style={{ ...styles.generateButton, backgroundColor: "#00f" }}
              onPress={handlePinGeneration}
            >
              <Text style={styles.generateButtonText}>Generate PINs</Text>
            </TouchableOpacity>
          )
        }


      </>
      )}
    </ScrollView>
  );
};

const PinInven = ({
  selectMode,
  setSelectMode,
}: {
  selectMode: any;
  setSelectMode: any;
}) => {
  const [search, setSearch] = useState("");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [printModalVisibility, setPrintModalVisibility] = useState(false);
  const [printVisible, setPrintVisible] = useState<string | false>(false);
  const [batchesData, setBatchesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);



  const getInven = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPrintInventory();
      if (response && response.success) {
        setBatchesData(response.data || []);
      } else {
        setError(response?.error || "Failed to load print inventory.");
      }
    } catch (err: any) {
      console.log(err);
      setError(err.message || "An unexpected error occurred while loading inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getInven();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await getInven();
    setRefreshing(false);
  }, []);

  // const batchesData = [
  //   {
  //     id: "1",
  //     operator: "MTN",
  //     amount: 100,
  //     quantity: 5,
  //     date: "10/24/2023, 2:30:00 PM",
  //     status: "READY",
  //   },
  //   {
  //     id: "2",
  //     operator: "AIRTEL",
  //     amount: 200,
  //     quantity: 3,
  //     date: "10/23/2023, 9:15:00 AM",
  //     status: "READY",
  //   },
  // ];

  const toggleSelectBatch = (id: any) => {
    if (selectedBatches.includes(id)) {
      setSelectedBatches(selectedBatches.filter((batchId) => batchId !== id));
    } else {
      setSelectedBatches([...selectedBatches, id]);
    }
  };

  const filteredBatches = batchesData.filter((batch) =>
    (batch.metadata?.network || "").toLowerCase().includes(search.toLowerCase()),
  );

  const renderBatch = ({ item }: RenderBatchProps) => {
    const isSelected = selectedBatches.includes(item.id);

    return (
      <>
        <PrintPreview
          visible={printVisible === item.id}
          onClose={() => setPrintVisible(false)}
          batches={[{
            id: item.id,
            networkId: item.metadata?.network,
            amount: item.metadata?.faceValue,
            pins: (item.printedPins || []).map((p: any) => ({
              ...p,
              pin: p.pinCode || p.pin, // Fallback to pin if pinCode doesn't exist
              serial: p.serialNumber || p.serial
            })),
            serialNumber: item.serialNumber,
          }]}
        />
        <TouchableOpacity
          style={[
            styles.batchCard,
            selectMode && isSelected && styles.selectedBatch,
          ]}
          onPress={() => selectMode && toggleSelectBatch(item.id)}
        >
          <View style={styles.batchHeader}>
            <View
              style={[
                styles.operatorIcon,
                {
                  backgroundColor:
                    item.metadata?.network === "MTN" ? "#FFD700" :
                      item.metadata?.network === "AIRTEL" ? "#FF0000" :
                        item.metadata?.network === "GLO" ? "#00FF00" :
                          item.metadata?.network === "9MOBILE" ? "#004d00" : "#FF7F7F",
                },
              ]}
            >
              <Text style={styles.operatorInitial}>{item.metadata?.network?.[0]}</Text>
            </View>
            <Text style={styles.batchTitle}>
              <Text>
                {item.metadata?.network} ₦{item.metadata?.faceValue} PINs
              </Text>
              <View>
                <Text style={styles.date}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                </Text>
              </View>
            </Text>
            <View>
              <Text style={styles.status}>{item.status}</Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 15,
              }}
            >
              <Text style={styles.quantity}>Quantity: {item.metadata?.quantity}</Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {selectMode ? (
                  <TouchableOpacity onPress={() => toggleSelectBatch(item.id)}>
                    <Text style={styles.selectButton}></Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setPrintVisible(item.id)}
                    >
                      <Text
                        style={{
                          color: "rgb(29 78 216)",
                          fontWeight: "bold",
                          verticalAlign: "middle",
                          marginBottom: 10,
                        }}
                      >
                        {" "}
                        <Ionicons
                          name="download-outline"
                          size={18}
                          style={{ marginBottom: 5 }}
                        />{" "}
                        Download
                      </Text>
                    </TouchableOpacity>
                    {/* <Ionicons
                      name="download-outline"
                      size={16}
                      style={{
                        marginRight: 12,
                        borderRadius: 6,
                        flexDirection: "row-reverse",
                        paddingVertical: 6,
                      }}
                    /> */}
                  </View>
                )}
              </View>
            </View>
          </View>

          {selectMode && isSelected && (
            <View style={styles.checkbox}>
              <Text>
                <Ionicons name="checkmark-circle" color={"green"} size={20} />
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </>
    );
  };

  return (
    <>
      <PrintPreview
        visible={printModalVisibility}
        onClose={() => setPrintModalVisibility(false)}
        batches={batchesData.filter(b => selectedBatches.includes(b.id)).map(b => ({
          id: b.id,
          networkId: b.metadata?.network,
          amount: b.metadata?.faceValue,
          pins: (b.printedPins || []).map((p: any) => ({
            ...p,
            pin: p.pinCode || p.pin,
            serial: p.serialNumber || p.serial
          }))
        }))}
      />
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search batch ID..."
          value={search}
          onChangeText={setSearch}
        />

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: 40 }}>
            <ActivityIndicator size="large" color="#1D4ED8" />
            <Text style={{ marginTop: 12, color: "#6B7280" }}>Loading inventory...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBatches}
            keyExtractor={(item) => item.id}
            renderItem={renderBatch}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              !error ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Ionicons name="documents-outline" size={48} color="#D1D5DB" />
                  <Text style={{ marginTop: 12, color: "#6B7280", fontSize: 16, fontWeight: "500" }}>No print batches found</Text>
                  <Text style={{ marginTop: 4, color: "#9CA3AF", fontSize: 13, textAlign: "center" }}>Your generated PIN batches will appear here.</Text>
                </View>
              ) : null
            }
          />
        )}

        {selectMode && selectedBatches.length > 0 && (
          <BottomBar
            selectedNumber={selectedBatches.length}
            onClick={() => setPrintModalVisibility(true)}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: "rgb(243 244 246)",
  },
  tab: {
    flex: 1,
    padding: 12,
    backgroundColor: "#e5e7eb",
    fontWeight: "bold",
    justifyContent: "space-between",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  tabText: {
    color: "#888",
    fontWeight: "bold",
  },
  tabTextActive: {
    color: "#000",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 10,
  },
  networkContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 50,
  },
  networkButton: {
    alignItems: "center",
    width: 70,
  },
  networkCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  networkLetter: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  networkLabel: {
    fontSize: 12,
  },
  denominationContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 50,
  },
  denominationButton: {
    width: "23%",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginRight: "2%",
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  denominationText: {
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 50,
  },
  totalCostContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 70,
    paddingHorizontal: 10,
  },
  totalCostText: {
    fontWeight: "bold",
  },
  totalCostValue: {
    fontWeight: "bold",
    color: "#0000FF",
  },
  generateButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  generateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  //   new content

  activeTabText: {
    color: "#000",
    fontWeight: "bold",
  },
  tabContent: {
    flex: 1,
  },

  //   NEW NEW STYLES
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  selectMultiple: { color: "#3b82f6", fontWeight: "bold" },
  tabContainer: { flexDirection: "row", marginBottom: 16 },
  searchInput: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  batchCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    position: "relative",
  },
  batchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  operatorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  operatorInitial: { fontWeight: "bold", color: "#fff" },
  batchTitle: { flex: 1, marginLeft: 8, fontWeight: "bold" },
  status: {
    color: "green",
    fontWeight: "bold",
    backgroundColor: "rgba(204, 255, 204, 1)",
    borderRadius: 15,
    padding: 5,
    fontSize: 11,
  },
  date: { color: "#6b7280", marginVertical: 4, fontSize: 11 },
  quantity: { fontWeight: "500" },
  actions: { flexDirection: "row", marginTop: 8 },
  actionButton: {
    marginRight: 12,
    borderRadius: 6,
    flexDirection: "row-reverse",
    backgroundColor: "#ccd6f244",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectButton: { marginTop: 8, color: "#3b82f6", fontWeight: "bold" },
  selectedBatch: { borderWidth: 2, borderColor: "#3b82f6" },
  checkbox: { position: "absolute", bottom: 8, right: 8 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgb(17 24 39 )",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000000ff",
    borderRadius: 15,
  },
  printAllButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    gap: 2,
    verticalAlign: "middle",
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    marginLeft: 10,
  },
});