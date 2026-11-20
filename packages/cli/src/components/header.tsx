// export function Header(){
//     return (
//         <box justifyContent="center" alignItems="center">
//             <box flexDirection="row" justifyContent="center" gap={0.5} alignItems="center">
//                 <ascii-font font="tiny" text="Night" color="gray"/>
//                 <ascii-font font="tiny" text="Code"/>
//             </box>
//         </box>
//     );
// };



import { useAuth } from "../providers/auth";

export function Header() {
  const { user, isLoading } = useAuth();

  const accountLabel = isLoading
    ? "Checking account..."
    : user
      ? `Signed in: ${user.email}`
      : "Not signed in";

  return (
    <box justifyContent="center" alignItems="center" flexDirection="column">
      <box flexDirection="row" justifyContent="center" gap={0.5} alignItems="center">
        <ascii-font font="tiny" text="Night" color="gray" />
        <ascii-font font="tiny" text="Code" />
      </box>
      <text fg="gray">{accountLabel}</text>
    </box>
  );
}