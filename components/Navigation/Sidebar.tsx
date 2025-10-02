import React from 'react'
import { SidebarHeader, Sidebar, SidebarContent, SidebarGroup, SidebarFooter } from '../ui/sidebar'

const Sidebar = () => {
  return (
    <div>
      <Sidebar>
        <SidebarHeader>
          <h2>Sidebar Title</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <h3>Group Title</h3>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <p>Footer Content</p>
        </SidebarFooter>
      </Sidebar>
    </div>
  )
}

export default Sidebar