// components/equipmentCard/equipmentCard.js
Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },
  methods: {
    navigateToDetail() {
      this.triggerEvent('detail', { id: this.data.item.id })
    },
    showActions() {
      this.triggerEvent('actions', { id: this.data.item.id })
    }
  }
})