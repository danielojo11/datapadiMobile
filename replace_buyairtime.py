import re

file_path = "app/(provider)/components/drawers/BuyAirtime.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace Step types
content = content.replace(
    "type Step = 'NETWORK' | 'DETAILS' | 'CONFIRM' | 'PIN' | 'SUCCESS';",
    "type Step = 'DETAILS' | 'PIN' | 'SUCCESS';"
)

content = content.replace(
    "const [step, setStep] = useState<Step>('NETWORK');",
    "const [step, setStep] = useState<Step>('DETAILS');"
)

content = content.replace(
    "setStep('NETWORK');",
    "setStep('DETAILS');"
)

content = re.sub(
    r"  const handleNetworkSelect = \(networkId: NetworkId\) => \{[\s\S]*?    setStep\('DETAILS'\);\n  \};\n",
    "",
    content
)

new_ui = """            {step === 'DETAILS' && (
              <View style={styles.stepContainer}>
                <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
                  <Text style={styles.subText}>Select a network provider</Text>
                  
                  <View style={styles.networkContainer}>
                    {networks.map((network) => (
                      <TouchableOpacity
                        key={network.id}
                        style={[
                          styles.networkButton,
                          selectedNetwork === network.id && styles.networkButtonSelected
                        ]}
                        onPress={() => {
                          setSelectedNetwork(network.id);
                          setErrorMessage('');
                        }}
                      >
                        <View style={[styles.networkCircle, { backgroundColor: network.color }]}>
                          <Text style={styles.networkLetter}>{network.label.charAt(0)}</Text>
                        </View>
                        <Text style={styles.networkLabel}>{network.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 24 }]}>
                    <Text style={styles.inputLabel}>Amount</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.currencySymbol}>{CURRENCY}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Amount (Min ₦50)"
                        keyboardType="number-pad"
                        value={amount}
                        onChangeText={(text) => {
                          setAmount(text);
                          setErrorMessage('');
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="call-outline" size={18} color="#9CA3AF" />
                      <TextInput
                        style={styles.input}
                        placeholder="08012345678"
                        keyboardType="number-pad"
                        maxLength={11}
                        value={phoneNumber}
                        onChangeText={(text) => {
                          setPhoneNumber(text.replace(/\D/g, ''));
                          setErrorMessage('');
                        }}
                      />
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.bottomAnchored}>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      (!selectedNetwork || !amount || Number(amount) < 50 || phoneNumber.length < 10) && styles.disabledBtn
                    ]}
                    disabled={!selectedNetwork || !amount || Number(amount) < 50 || phoneNumber.length < 10}
                    onPress={() => setStep('PIN')}
                  >
                    <Text style={styles.btnText}>Proceed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 'PIN' && (
              <View style={styles.stepContainer}>
                <TouchableOpacity onPress={() => { setStep('DETAILS'); setPinError(false); setErrorMessage(''); }} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={16} color="#003366" />
                  <Text style={styles.backButtonText}>Edit Details</Text>
                </TouchableOpacity>

                <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
                  <View style={[styles.receiptCard, { marginBottom: 30 }]}>
                    <Text style={styles.receiptHeader}>You are about to send</Text>
                    <Text style={styles.receiptNetwork}>{selectedNetwork} Airtime</Text>
                    <Text style={styles.receiptAmount}>{CURRENCY}{Number(amount).toLocaleString()}</Text>

                    <View style={styles.dashedDividerWrapper}>
                      <View style={styles.dashedLine} />
                    </View>

                    <View style={styles.beneficiarySection}>
                      <Text style={styles.beneficiaryLabel}>BENEFICIARY</Text>
                      <Text style={styles.beneficiaryPhone}>{phoneNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { textAlign: 'center', marginBottom: 20 }]}>Enter Transaction PIN</Text>

                    <TransactionPinInput
                      onComplete={(pin) => {
                        setTransactionPin(pin);
                        handlePurchase(pin);
                      }}
                      error={pinError}
                      clearError={() => setPinError(false)}
                      isLoading={isLoading}
                    />

                    {isLoading && (
                      <View style={[styles.processingRow, { marginTop: 30 }]}>
                        <ActivityIndicator size="small" color="#003366" />
                        <Text style={{ marginLeft: 8, color: '#003366', fontWeight: '600' }}>Processing Payment...</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            )}"""

# We search from "{step === 'NETWORK' && (" to "{step === 'SUCCESS' && ("
pattern = r" {12}\{step === 'NETWORK' && \([\s\S]*?(?= {12}\{step === 'SUCCESS' && \()"
content = re.sub(pattern, new_ui + "\n\n", content)

with open(file_path, "w") as f:
    f.write(content)

print("Replacement done!")
