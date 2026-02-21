module.exports = {
  privGroups: [
    {
      id: "USERS",
      name: "User Permissions",
    },
    {
      id: "ROLES",
      name: "Role Permissions",
    },
    {
      id: "CATEGORIES",
      name: "Category Permissions",
    },
    {
      id: "AUDITLOGS",
      name: "AuditLogs Permissions",
    },
  ],

  privileges: [
    // USERS
    {
      key: " user_view",
      name: "User View",
      group: "USERS",
      description:
        "User view permission allows the user to view the list of users and their details.",
    },
    {
      key: " user_add",
      name: "User Add",
      group: "USERS",
      description: "User add permission allows the user to add new users.",
    },
    {
      key: " user_update",
      name: "User Update",
      group: "USERS",
      description:
        "User update permission allows the user to update existing users.",
    },
    {
      key: " user_delete",
      name: "User Delete",
      group: "USERS",
      description:
        "User delete permission allows the user to delete existing users.",
    },
    // ROLES
    {
      key: " role_view",
      name: "Role View",
      group: "ROLES",
      description:
        "Role view permission allows the user to view the list of roles and their details.",
    },
    {
      key: " role_add",
      name: "Role Add",
      group: "ROLES",
      description: "Role add permission allows the user to add new roles.",
    },
    {
      key: " role_update",
      name: "Role Update",
      group: "ROLES",
      description:
        "Role update permission allows the user to update existing roles.",
    },
    {
      key: " role_delete",
      name: "Role Delete",
      group: "ROLES",
      description:
        "Role delete permission allows the user to delete existing roles.",
    },
    // CATEGORIES
    {
      key: " category_view",
      name: "Category View",
      group: "CATEGORIES",
      description:
        "Category view permission allows the user to view the list of categories and their details.",
    },
    {
      key: " category_add",
      name: "Category Add",
      group: "CATEGORIES",
      description:
        "Category add permission allows the user to add new categories.",
    },
    {
      key: " category_update",
      name: "Category Update",
      group: "CATEGORIES",
      description:
        "Category update permission allows the user to update existing categories.",
    },
    {
      key: " category_delete",
      name: "Category Delete",
      group: "CATEGORIES",
      description:
        "Category delete permission allows the user to delete existing categories.",
    },
    // AUDITLOGS
    {
      key: " auditlogs_view",
      name: "AuditLogs View",
      group: "AUDITLOGS",
      description:
        "AuditLogs view permission allows the user to view the list of audit logs.",
    },
  ],
};
