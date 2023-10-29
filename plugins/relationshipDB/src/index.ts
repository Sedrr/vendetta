import { commands } from "@vendetta";
import { findByName,findByProps, findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
const Avatars = findByProps("BOT_AVATARS");
const { createBotMessage } = findByProps("createBotMessage");
const { receiveMessage } = findByProps("receiveMessage");
const OAuth2AuthorizeModal = findByName("OAuth2AuthorizeModal");
const Locale = findByProps("Messages");
const UserStore = findByStoreName("UserStore");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const { pushModal, popModal } = findByProps("pushModal", "popModal");
function openOauth2Modal() {
    pushModal({
      key: "oauth2-authorize",
      modal: {
        key: "oauth2-authorize",
        modal: OAuth2AuthorizeModal,
        animation: "slide-up",
  
        shouldPersistUnderModals: false,
        props: {
          clientId: "1166756085554757733",
  
          scopes: ["identify"],
          responseType: "token",
          permissions: 0n,
          cancelCompletesFlow: false,
          callback: async ({ location }) => {
                const query = location.split("#")[1];
                const params = new URLSearchParams(query);
                const newToken = params.get("access_token")!!;
                storage.token = (newToken)
          },
          dismissOAuthModal: () => popModal("oauth2-authorize"),
        },
        closable: true,
      },
    });
  }

function getTokenStorageKey(): string {
    const userId = UserStore.getCurrentUser().id;
    const key = "relationshipDB_" + userId;
    return key;
}

function sendSystemMessage(message: string) {
    const channel = SelectedChannelStore.getChannelId();
    const author = UserStore.getUser("1155605314557718620")
    receiveMessage(
        channel,
        Object.assign(
            createBotMessage({
                channelId: channel,
                content: message,
            }),
            {
                author,
            }
        )
    );
}

let patches = [];

export default {
    onLoad: () => {
        patches.push(commands.registerCommand({
            name: "hell",
            displayName: "hell",
            description: "pain",
            displayDescription: "AAAAAAAAAAAAAAAAAA",
            options: [],
            // @ts-ignore
            applicationId: -1,
            inputType: 1,
            type: 1,

            execute: (args, ctx) => {
                openOauth2Modal()
            }
        }));

        
    },
    onUnload: () => {
        for (const unpatch of patches) unpatch()
    }
}
//{
//    name: "message",
//    displayName: "message",
//    description: Locale.Messages.COMMAND_SHRUG_MESSAGE_DESCRIPTION,
//    displayDescription: Locale.Messages.COMMAND_SHRUG_MESSAGE_DESCRIPTION,
//    required: true,
//    // @ts-ignore
//    type: 3
//}