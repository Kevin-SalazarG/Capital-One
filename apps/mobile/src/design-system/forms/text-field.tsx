import { useEffect, useState, type ReactElement, type Ref } from "react";
import { Pressable, Text, View, type TextInput } from "react-native";
import Eye from "lucide-react-native/icons/eye";
import EyeOff from "lucide-react-native/icons/eye-off";
import LockKeyhole from "lucide-react-native/icons/lock-keyhole";
import Mail from "lucide-react-native/icons/mail";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { TextField as HeroTextField } from "heroui-native/text-field";
import { Input } from "heroui-native/input";
import { Label } from "heroui-native/label";
import { useAuthColors } from "../theme/use-theme-colors";

interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly onBlur?: () => void;
  readonly inputRef?: Ref<TextInput>;
  readonly error?: string;
  readonly secure?: boolean;
  readonly email?: boolean;
  readonly disabled?: boolean;
  readonly onSubmitEditing?: () => void;
  readonly returnKeyType?: "next" | "go";
  readonly appearance?: "default" | "brand";
}

export function TextField({
  label,
  value,
  onChangeText,
  onBlur,
  inputRef,
  error,
  secure = false,
  email = false,
  disabled = false,
  onSubmitEditing,
  returnKeyType = "go",
  appearance = "default",
}: TextFieldProps): ReactElement {
  const [revealed, setRevealed] = useState(false);
  const focus = useSharedValue(0);
  const focusStyle = useAnimatedStyle(() => ({ opacity: focus.value }));
  const colors = useAuthColors();
  useEffect(() => {
    if (value.length === 0 || disabled) setRevealed(false);
  }, [value, disabled]);
  return (
    <HeroTextField isInvalid={Boolean(error)} isDisabled={disabled} className="gap-2">
      <Label
        className={appearance === "brand" ? "text-[14px] font-medium text-auth-foreground" : ""}
      >
        {label}
      </Label>
      <View className="relative">
        <Input
          variant="secondary"
          ref={inputRef}
          accessibilityLabel={label}
          accessibilityHint={error}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            focus.value = withTiming(1, { duration: 160, reduceMotion: ReduceMotion.System });
          }}
          onBlur={() => {
            focus.value = withTiming(0, { duration: 160, reduceMotion: ReduceMotion.System });
            onBlur?.();
          }}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secure && !revealed}
          keyboardType={email ? "email-address" : "default"}
          textContentType={secure ? "password" : email ? "username" : "none"}
          autoComplete={secure ? "current-password" : email ? "username" : "off"}
          returnKeyType={returnKeyType}
          submitBehavior={returnKeyType === "next" ? "submit" : "blurAndSubmit"}
          onSubmitEditing={onSubmitEditing}
          background={null}
          className={[
            "min-h-15 rounded-xl px-4 py-4 text-[17px] leading-6",
            secure ? "pr-16" : "",
            appearance === "brand" && (secure || email) ? "pl-12" : "",
            appearance === "brand"
              ? "border border-auth-border bg-auth-field text-auth-foreground ios:shadow-none android:shadow-none ios:outline-0 ios:focus:outline-0 android:border-auth-border android:focus:border-auth-action"
              : "",
            error ? "border-danger android:border-danger android:focus:border-danger" : "",
          ].join(" ")}
        />
        {appearance === "brand" ? (
          <Animated.View
            pointerEvents="none"
            className={
              error
                ? "absolute inset-0 rounded-xl border-2 border-danger"
                : "absolute inset-0 rounded-xl border-2 border-auth-action"
            }
            style={focusStyle}
          />
        ) : null}
        {appearance === "brand" && (email || secure) ? (
          <View
            pointerEvents="none"
            className="absolute left-4 top-0 bottom-0 justify-center"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {email ? (
              <Mail size={19} strokeWidth={1.6} color={colors.muted} />
            ) : (
              <LockKeyhole size={19} strokeWidth={1.6} color={colors.muted} />
            )}
          </View>
        ) : null}
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
            accessibilityState={{ disabled, checked: revealed }}
            disabled={disabled}
            onPress={() => setRevealed((current) => !current)}
            className="absolute right-1 top-0 bottom-0 min-h-12 w-12 items-center justify-center active:opacity-60"
          >
            {revealed ? (
              <EyeOff size={21} strokeWidth={1.6} color={colors.muted} />
            ) : (
              <Eye size={21} strokeWidth={1.6} color={colors.muted} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="text-[13px] leading-5 text-danger"
        >
          {error}
        </Text>
      ) : null}
    </HeroTextField>
  );
}
