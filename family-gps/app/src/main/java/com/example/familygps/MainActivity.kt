package com.example.familygps

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FamilyRestroom
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.familygps.presentation.theme.FamilyGpsTheme

enum class AppRole { ADMIN, RECEIVER }

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FamilyGpsTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    RoleSelectionScreen()
                }
            }
        }
    }
}

@Composable
private fun RoleSelectionScreen() {
    var selectedRole by rememberSaveable { mutableStateOf<AppRole?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp, vertical = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Family GPS",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Private family location sharing",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(32.dp))
        Text(
            text = "Choose how you want to use the app.",
            style = MaterialTheme.typography.titleMedium,
        )
        Spacer(Modifier.height(16.dp))

        RoleCard(
            title = "Parent / Admin",
            description = "Manage your family connection and view an authorized family member’s location.",
            icon = { Icon(Icons.Outlined.FamilyRestroom, contentDescription = null) },
            selected = selectedRole == AppRole.ADMIN,
            onClick = { selectedRole = AppRole.ADMIN },
        )
        Spacer(Modifier.height(12.dp))
        RoleCard(
            title = "Family Member",
            description = "Share your location transparently with your connected family administrator.",
            icon = { Icon(Icons.Outlined.LocationOn, contentDescription = null) },
            selected = selectedRole == AppRole.RECEIVER,
            onClick = { selectedRole = AppRole.RECEIVER },
        )
        Spacer(Modifier.height(24.dp))
        Button(
            onClick = { /* Next screen is wired after Auth and DataStore are configured. */ },
            enabled = selectedRole != null,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Continue")
        }
    }
}

@Composable
private fun RoleCard(
    title: String,
    description: String,
    icon: @Composable () -> Unit,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = androidx.compose.material3.CardDefaults.cardColors(
            containerColor = if (selected) {
                MaterialTheme.colorScheme.primaryContainer
            } else {
                MaterialTheme.colorScheme.surfaceVariant
            },
        ),
    ) {
        Row(
            modifier = Modifier.padding(18.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            icon()
            Spacer(Modifier.padding(horizontal = 8.dp))
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(4.dp))
                Text(description, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}
